import axios from "axios";
import FormData from "form-data";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import saleService from "../services/saleService.js";
import alertService from "../services/alertService.js";
import productService from "../services/productService.js";
import forcastServices from "../services/forcastServices.js";
import inventoryService from "../services/inventoryService.js";
import notificationService from "../services/notificationService.js";

class saleController {
  createSaleWithCSV = async (req, res) => {
    try {
      const formatDateToMidnightISOString = (date) => {
        const d = new Date(date);
        d.setUTCHours(0, 0, 0, 0); // set to midnight UTC
        return d.toISOString(); // returns format like "2023-09-18T00:00:00.000Z"
      };
      let uniqueSkus = [];
      const forecastBaseUrl = "https://stock-ml-model.onrender.com";
      const form = new FormData();

      form.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      await axios
        .post(`${forecastBaseUrl}/upload-train-data/`, form, {
          headers: {
            authorization: "hashbin2",
          },
        })
        .catch((error) => {
          return Response.serverError(res, error);
        });
      console.log("train ho gaya");
      await Promise.all(
        req.csvData.map(async (sale) => {
          let product = await productService.findProduct({
            sku: sale.SKU,
            user: req.userId,
          });
          console.log("product find ki");
          if (!product) {
            console.log("product nahi mila");
            await notificationService.createNotification({
              message: `Product ${sale.SKU} is not availabe in our database`,
              userId: req.userId,
            });
          } else {
            console.log("product mila");
            await saleService.createSale({
              sku: sale.SKU,
              userId: req.userId,
              id: sale.Productid,
              orderId: sale.OrderId,
              unitsSold: sale.UnitsSold,
              sales: sale.Sales,
              saleDate: sale.SaleDate,
              currentInventory: sale.CurrentInventory,
              reorderPoint: sale.ReorderPoint,
              priceAtSale: sale.Price,
            });
            console.log("sale create ki");
            // add unique sku to array
            if (!uniqueSkus.some((obj) => obj.sku === sale.SKU)) {
              uniqueSkus.push({
                sku: sale.SKU,
              });
            }
          }
        })
      );
      ///////////////////////////////////////////////////
      // create forcast
      await Promise.all(
        uniqueSkus.map(async (skuObj) => {
          console.log("skuObj:", skuObj);
          // find inventory
          let inventory = await inventoryService.findInventory({
            sku: skuObj.sku,
            userId: req.userId,
          });
          // 3. Prepare forecast payload
          let item = await req.csvData.find((item) => item.SKU === skuObj.sku);
          const forecastPayload = {
            sku: item.SKU,
            product_title: item.ProductTitle,
            category: item.Category,
            subcategory: item.Subcategory,
            price: parseInt(item.Price),
            material: item.Material,
            gender_age: item.Gender_Age,
            current_inventory: parseInt(item.CurrentInventory),
            lead_time: inventory.lead_time,
            safety_stock: inventory.safety_stock,
            start_day: formatDateToMidnightISOString(Date.now()),
            end_day: formatDateToMidnightISOString(
              Date.now() + 1000 * 60 * 60 * 24 * 90
            ), // 90 days later
          };
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
                sku: item.SKU,
                userId: req.userId,
                category: item.Category,
                description: item.ProductTitle,
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
                  sku: skuObj.sku,
                  user: req.userId,
                  type: "overstock",
                });
                if (!alert) {
                  console.log("overstock alert nahi mila", item);
                  await alertService.createAlert({
                    user: req.userId,
                    sku: item.SKU,
                    description: item.ProductTitle,
                    quantity: inventory.stock,
                    weeklyDemand: sum7,
                    stockOutDate: Date.now(),
                    type: "overstock",
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.sku, user: req.userId, type: "overstock" },
                    {
                      quantity: inventory.stock,
                      weeklyDemand: sum7,
                      stockOutDate: Date.now(),
                    }
                  );
                }
              }

              if (reorderAlert !== alertMessage2) {
                const match = reorderAlert.match(/Day (\d+)/);
                let alert = await alertService.findAlert({
                  sku: skuObj.sku,
                  user: req.userId,
                  type: "reorder",
                });
                if (!alert) {
                  await alertService.createAlert({
                    user: req.userId,
                    sku: item.SKU,
                    description: item.ProductTitle,
                    quantity: inventory.stock,
                    weeklyDemand: sum7,
                    type: "reorder",
                    stockOutDate:
                      Date.now() + 1000 * 60 * 60 * 24 * parseInt(match[1], 10),
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.sku, user: req.userId, type: "reorder" },
                    {
                      quantity: inventory.stock,
                      weeklyDemand: sum7,
                      stockOutDate:
                        Date.now() +
                        1000 * 60 * 60 * 24 * parseInt(match[1], 10),
                    }
                  );
                }
              }

              // subtract forecasted demand from current inventory untill stockout
              let currentStock = inventory.stock;
              for (const day of forecastData) {
                inventory.stock -= day.forecast;
                if (inventory.stock <= 0) {
                  console.log("stockout ho gaya", inventory.stock);
                  console.log("day:", day);
                  // create alert for stockout
                  let alert = await alertService.findAlert({
                    sku: skuObj.sku,
                    user: req.userId,
                    type: "stockout",
                  });
                  console.log("alert:", alert);
                  if (!alert) {
                    await alertService.createAlert({
                      sku: skuObj.sku,
                      user: req.userId,
                      description: item.ProductTitle,
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
                sku: skuObj.sku,
                userId: req.userId,
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
        })
      );
      Response.success(res, "Sales data uploaded successfully");
    } catch (error) {
      console.log(error);
      // return the response of server error
      return Response.serverError(res, error);
    }
  };
  createSale = async (req, res) => {
    try {
      const response = await saleService.createSale(req.body);
      if (!response) {
        return Response.badRequest(res, messageUtil.RECORD_NOT_CREATED);
      }
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  TopSku = async (req, res) => {
    try {
      console.log("top sku");
      const response = await saleService.topSellingProducts({
        userId: req.userId,
      });

      if (!response) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      Response.success(res, messageUtil.OK, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new saleController();
