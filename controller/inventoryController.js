import axios from "axios";
import plimit from "p-limit";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
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
      console.log("Query Params:", req.userId);
      const response = await inventoryServices.findAll({
        ...req.query,
        userId: req.userId,
      });
      if (response.inventory.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
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
      // update all inventories with lead time and safety stock
      let inventory = await inventoryServices.updateMany({
        lead_time: req.body.lead_time,
        safety_stock: req.body.safety_stock,
      });
      console.log(req.csvData);
      if (!inventory) {
        return Response.badRequest(res, messageUtil.INVENTORY_NOT_FOUND);
      }
      if (req.csvData) {
        // 1. Deduplicate by SKU
        // const uniqueDataMap = new Map();
        // req.csvData.forEach((item) => {
        //   const trimmedSku = item?.SKU?.trim?.();
        //   if (!uniqueDataMap.has(trimmedSku)) {
        //     uniqueDataMap.set(trimmedSku, item);
        //   }
        // });
        // const uniqueItems = Array.from(uniqueDataMap.values());
        // console.log("Unique Items:", uniqueItems);
        // 2. Limit concurrency (e.g., 5 at a time)
        const limit = plimit(5);

        // 3. Process with controlled concurrency
        const promises = req.csvData.map((item) =>
          limit(async () => {
            let inventory = await inventoryServices.findInventoryId({
              sku: item.SKU,
              userId: req.userId,
            });

            if (!inventory) {
              const product = await productService.createProduct({
                sku: item?.SKU?.trim?.(),
                user: req.userId,
                name: item.Category,
                description: item.ProductTitle,
                category: item.Category,
                subcategory: item.Subcategory,
                material: item.Material,
              });

              inventory = await inventoryServices.createInventory({
                sku: item.SKU,
                userId: req.userId,
                stock: item.Inventory_Total,
                price: item.Price,
                stockInDate: Date.now(),
                size: item.Size,
                color: item.Color,
                lead_time: req.body.lead_time,
                safety_stock: req.body.safety_stock,
                // reorderPoint: item.ReorderPoint,
                gender_age: item.Gender_Age,
                material: item.Material,
              });
            } else {
              await inventoryServices.updateInventory(
                { sku: item.SKU, userId: req.userId },
                {
                  stock: item.Inventory_Total,
                  stockInDate: Date.now(),
                  size: item.Size,
                  color: item.Color,
                  price: item.Price,
                  lead_time: req.body.lead_time,
                  safety_stock: req.body.safety_stock,
                  // reorderPoint: item.ReorderPoint,
                  gender_age: item.Gender_Age,
                  material: item.Material,
                }
              );
            }
          })
        );

        await Promise.all(promises);
      }

      await Promise.all(
        // find all products with unique SKUs
        req.csvData.map(async (skuObj) => {
          console.log("skuObj:", skuObj);
          // find inventory
          // let inventory = await inventoryServices.findInventory({
          //   sku: skuObj.SKU,
          //   userId: req.userId,
          // });

          const forecastPayload = {
            sku: skuObj.SKU,
            product_title: skuObj.ProductTitle,
            category: skuObj.Category,
            subcategory: skuObj.Subcategory,
            price: skuObj.Price,
            material: skuObj.Material,
            gender_age: skuObj.Gender_Age,
            current_inventory: skuObj.Inventory_Total,
            lead_time: req.body.lead_time,
            safety_stock: req.body.safety_stock,
            start_day: formatDateToMidnightISOString(Date.now()),
            end_day: formatDateToMidnightISOString(
              Date.now() + 1000 * 60 * 60 * 24 * 90
            ), // 90 days later
          };
          console.log("Forecast Payload:", forecastPayload);
          // console.log("Forecast Payload:", forecastPayload);
          // 4. Send to Forecast API

          await axios
            .post(`${forecastBaseUrl}/make-forecast/`, forecastPayload, {
              headers: {
                authorization: "hashbin2",
              },
            })
            .then(async (forecastResponse) => {
              let forecastData = null;
              let reorderAlert = null;
              let stockoutAlert = null;
              if (Array.isArray(forecastResponse.data[2])) {
                forecastData = forecastResponse.data[2]; // If it's in the second index
                reorderAlert = forecastResponse.data[0]; // If it's in the first index
                stockoutAlert = forecastResponse.data[1]; // If it's in the first index
              } else if (Array.isArray(forecastResponse.data[3])) {
                forecastData = forecastResponse.data[3]; // If it's in the third index
                reorderAlert = forecastResponse.data[1]; // If it's in the first index
                stockoutAlert = forecastResponse.data[2]; // If it's in the first index
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
                sku: skuObj.SKU,
                userId: req.userId,
                category: skuObj.Category,
                description: skuObj.ProductTitle,
                forcast_demand: sum90,
                forcast_demand_7: sum7,
                days_demand_30: sum30,
                days_demand_60: sum60,
                days_demand_90: sum90,
              };
              let alertMessage =
                "Overstock Warning: Current inventory exceeds forecasted demand.";
              let alertMessage2 = "Stock level is sufficient.";
              if (
                forecastResponse.data[1] === alertMessage ||
                forecastResponse.data[2] === alertMessage
              ) {
                console.log("overstock warning");
                let alert = await alertService.findAlert({
                  sku: skuObj.SKU,
                  user: req.userId,
                  type: "overstock",
                });
                if (!alert) {
                  console.log("overstock alert nahi mila");
                  await alertService.createAlert({
                    user: req.userId,
                    sku: skuObj.SKU,
                    description: skuObj.ProductTitle,
                    quantity: skuObj.Inventory_Total,
                    weeklyDemand: sum7,
                    stockOutDate: Date.now(),
                    type: "overstock",
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.SKU, user: req.userId, type: "overstock" },
                    {
                      quantity: skuObj.Inventory_Total,
                      weeklyDemand: sum7,
                      stockOutDate: Date.now(),
                    }
                  );
                }
              }

              if (reorderAlert !== alertMessage2) {
                const match = reorderAlert.match(/Day (\d+)/);
                let alert = await alertService.findAlert({
                  sku: skuObj.SKU,
                  user: req.userId,
                  type: "reorder",
                });
                if (!alert) {
                  await alertService.createAlert({
                    user: req.userId,
                    sku: skuObj.SKU,
                    description: skuObj.ProductTitle,
                    quantity: skuObj.Inventory_Total,
                    weeklyDemand: sum7,
                    type: "reorder",
                    stockOutDate:
                      Date.now() + 1000 * 60 * 60 * 24 * parseInt(match[1], 10),
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.SKU, user: req.userId, type: "reorder" },
                    {
                      quantity: skuObj.Inventory_Total,
                      weeklyDemand: sum7,
                      stockOutDate:
                        Date.now() +
                        1000 * 60 * 60 * 24 * parseInt(match[1], 10),
                    }
                  );
                }
              }

              // subtract forecasted demand from current inventory untill stockout
              let currentStock = skuObj.Inventory_Total;
              for (const day of forecastData) {
                skuObj.Inventory_Total -= day.forecast;
                if (skuObj.Inventory_Total <= 0) {
                  console.log("stockout ho gaya", skuObj.Inventory_Total);
                  console.log("day:", day);
                  // create alert for stockout
                  let alert = await alertService.findAlert({
                    sku: skuObj.SKU,
                    user: req.userId,
                    type: "stockout",
                  });
                  console.log("alert:", alert);
                  if (!alert) {
                    await alertService.createAlert({
                      sku: skuObj.SKU,
                      user: req.userId,
                      description: skuObj.ProductTitle,
                      quantity: currentStock,
                      weeklyDemand: day.forecast,
                      type: "stockout",
                      stockOutDate: day.date,
                    });
                  } else {
                    await alertService.updateAlert(
                      { sku: skuObj.sku, user: req.userId, type: "stockout" },
                      {
                        quantity: currentStock,
                        weeklyDemand: day.forecast,
                        stockOutDate: day.date,
                      }
                    );
                  }
                  break; // Exit the loop once stockout is detected
                }
              }
              // 7. Save or Update Forecast
              const existingForecast = await forcastServices.findForcast({
                sku: skuObj.SKU,
                userId: req.userId,
              });

              if (existingForecast) {
                console.log("existing forecast mili");
                await forcastServices.updateForcast(
                  { sku: skuObj.SKU, userId: req.userId },
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
        })
      );
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
