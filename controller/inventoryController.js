import axios from "axios";
import response from "../utilities/response.js";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import saleService from "../services/saleService.js";
import alertService from "../services/alertService.js";
import productService from "../services/productService.js";
import forcastServices from "../services/forcastServices.js";
import inventoryServices from "../services/inventoryService.js";
class inventoryController {
  createInventory = async (req, res) => {
    try {
      const response = await inventoryServices.createInventory(req.body);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findAll = async (req, res) => {
    try {
      const response = await inventoryServices.findAll(req.query);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.error(res, error);
    }
  };

  findInventoryId = async (req, res) => {
    try {
      const response = await inventoryServices.findInventoryId(
        req.params.inventoryId
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.error(res, error);
    }
  };

  uploadInventory = async (req, res) => {
    try {
      const formatDateToMidnightISOString = (date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0); // set to midnight UTC
        return d.toISOString(); // returns format like "2023-09-18T00:00:00.000Z"
      };
      const forecastBaseUrl = "https://stock-ml-model.onrender.com";
      console.log("req.csvData", req.csvData);
      for (const item of req.csvData) {
        console.log("Item:", item);
        console.log("loop mai enter hua");
        // 1. Check if inventory exists
        let inventory = await inventoryServices.findInventoryId({
          sku: item.SKU,
          userId: req.userId,
        });

        console.log("inventory:", inventory);
        if (!inventory) {
          console.log("inventory nahi mili");
          const product = await productService.createProduct({
            sku: item.SKU,
            user: req.userId,
            name: item.Category,
            description: item.ProductTitle,
            category: item.Category,
            subcategory: item.Subcategory,
            material: item.Material,
          });
          console.log("product create kiya", product);
          inventory = await inventoryServices.createInventory({
            sku: item.SKU,
            userId: req.userId,
            stock: item.CurrentInventory,
            price: item.Price,
            stockInDate: Date.now(),
            size: item.Size,
            color: item.Color,
            lead_time: req.body.lead_time,
            safety_stock: req.body.safety_stock,
            reorderPoint: item.ReorderPoint,
          });
          console.log("inventory create kiya", inventory);
        } else {
          console.log("inventory mili");
          await inventoryServices.updateInventory(
            { sku: item.SKU, userId: req.userId },
            {
              stock: item.CurrentInventory,
              stockInDate: Date.now(),
              size: item.Size,
              color: item.Color,
              price: item.Price,
              lead_time: req.body.lead_time,
              safety_stock: req.body.safety_stock,
              reorderPoint: item.ReorderPoint,
            }
          );

          // 2. Check if sales exist for SKU
          const sales = await saleService.findSale({
            sku: item.SKU,
            userId: req.userId,
          });
          console.log("sales:", sales);
          if (sales) {
            console.log("sales mili");
            // 3. Prepare forecast payload
            const forecastPayload = {
              sku: item.SKU,
              product_title: item.ProductTitle,
              category: item.Category,
              subcategory: item.Subcategory,
              price: parseInt(item.Price),
              material: item.Material,
              gender_age: item.Gender_Age,
              current_inventory: parseInt(item.CurrentInventory),
              lead_time: 1,
              safety_stock: 10,
              start_day: formatDateToMidnightISOString(Date.now()),
              end_day: formatDateToMidnightISOString(
                Date.now() + 1000 * 60 * 60 * 24 * 90
              ), // 90 days later
            };

            // 4. Send to Forecast API
            await axios
              .post(`${forecastBaseUrl}/make-forecast`, forecastPayload, {
                headers: {
                  authorization: "hashbin2",
                },
              })
              .then(async (forecastResponse) => {
                let forecastData = null;

                if (Array.isArray(forecastResponse.data[2])) {
                  forecastData = forecastResponse.data[2]; // If it's in the second index
                } else if (Array.isArray(forecastResponse.data[3])) {
                  forecastData = forecastResponse.data[3]; // If it's in the third index
                }

                // Helper function to sum forecast for given number of days
                function sumForecast(days) {
                  return forecastData
                    .slice(0, days)
                    .reduce((sum, day) => sum + day.forecast, 0);
                }

                // Calculate sums
                const sum7 = sumForecast(7);
                const sum30 = sumForecast(30);
                const sum60 = sumForecast(60);
                const sum90 = sumForecast(90);
                // 6. Prepare forecast payload for DB
                const forecastPayloadForDB = {
                  sku: item.SKU,
                  userId: req.userId,
                  category: item.Category,
                  forcast_demand: sum90,
                  forcast_demand_7: sum7,
                  days_demand_30: sum30,
                  days_demand_60: sum60,
                  days_demand_90: sum90,
                };
                let alertMessage =
                  "Overstock Warning: Current inventory exceeds forecasted demand.";
                if (
                  forecastResponse.data[1] === alertMessage ||
                  forecastResponse.data[2] === alertMessage
                ) {
                  console.log("overstock warning");
                  await alertService.createAlert({
                    user: req.userId,
                    sku: item.SKU,
                    description: item.ProductTitle,
                    quantity: item.CurrentInventory,
                    weeklyDemand: sum7,
                    type: "overstock",
                  });
                }

                if (item.CurrentInventory <= item.ReorderPoint) {
                  await alertService.createAlert({
                    user: req.userId,
                    sku: item.SKU,
                    description: item.ProductTitle,
                    quantity: item.CurrentInventory,
                    weeklyDemand: sum7,
                    type: "reorder",
                  });
                }
                // 7. Save or Update Forecast
                const existingForecast = await forcastServices.findForcast({
                  sku: item.SKU,
                });

                if (existingForecast) {
                  console.log("existing forecast mili");
                  await forcastServices.updateForcast(
                    { sku: item.SKU, userId: req.userId },
                    forecastPayloadForDB
                  );
                } else {
                  console.log("existing forecast nahi mili");
                  await forcastServices.createForcast(forecastPayloadForDB);
                }
              })
              .catch((error) => {
                console.error("Error in forecast API:", error);
                // Handle the error as needed
              });
          }
        }
      }

      return Response.success(res, messageUtil.INVENTORY_UPDATE);
    } catch (error) {
      console.error("Update Inventory Error:", error);
      return Response.serverError(res, error);
    }
  };

  deleteInventory = async (req, res) => {
    try {
      const response = await inventoryServices.deleteInventory(
        req.params.inventoryId
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.error(res, error);
    }
  };
}

export default new inventoryController();
