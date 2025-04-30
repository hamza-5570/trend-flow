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
      let uniqueSkus = new Map();
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
            let inventory = await inventoryService.updateInventory(
              {
                sku: sale.SKU,
                size: sale.Size,
                color: sale.Color,
              },
              {
                $inc: { stock: -sale.UnitsSold },
              }
            );
            console.log("inventory update ki");
            // store unique sku and update stocks every sale
            if (!uniqueSkus.has(sale.SKU)) {
              uniqueSkus.set(sale.SKU, {
                sku: sale.SKU,
                stock: inventory.stock - sale.UnitsSold,
                description: sale.ProductTitle,
              });
            } else {
              let existingStock = uniqueSkus.get(sale.SKU).stock;
              uniqueSkus.set(sale.SKU, {
                sku: sale.SKU,
                stock: existingStock - sale.UnitsSold,
                description: sale.ProductTitle,
              });
            }
          }
        })
      );

      // create forcast
      await Promise.all(
        Array.from(uniqueSkus.values()).map(async (skuObj) => {
          console.log("skuObj:", skuObj);
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
            lead_time: 1,
            safety_stock: 10,
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
                category: item.product_title,
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
                let alert = await alertService.findAlert({
                  sku: skuObj.sku,
                  user: req.userId,
                  type: "overstock",
                });
                if (!alert) {
                  await alertService.createAlert({
                    user: req.userId,
                    sku: item.SKU,
                    description: item.ProductTitle,
                    quantity: item.CurrentInventory,
                    weeklyDemand: sum7,
                    type: "overstock",
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.sku, user: req.userId, type: "overstock" },
                    {
                      quantity: item.CurrentInventory,
                      weeklyDemand: sum7,
                    }
                  );
                }
              }

              if (item.CurrentInventory <= item.ReorderPoint) {
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
                    quantity: item.CurrentInventory,
                    weeklyDemand: sum7,
                    type: "reorder",
                  });
                } else {
                  await alertService.updateAlert(
                    { sku: skuObj.sku, user: req.userId, type: "reorder" },
                    {
                      quantity: item.CurrentInventory,
                      weeklyDemand: sum7,
                    }
                  );
                }
              }
              // 7. Save or Update Forecast
              const existingForecast = await forcastServices.findForcast({
                sku: item.SKU,
              });

              if (existingForecast) {
                console.log("existing forecast mili");
                let forcast = await forcastServices.updateForcast(
                  { sku: item.SKU, userId: req.userId },
                  forecastPayloadForDB
                );

                if (skuObj.stock <= 0) {
                  let alert = await alertService.findAlert({
                    sku: skuObj.sku,
                    user: req.userId,
                    type: "stockout",
                  });
                  if (!alert) {
                    await alertService.createAlert({
                      sku: skuObj.sku,
                      user: req.userId,
                      description: skuObj.description,
                      quantity: 0,
                      weeklyDemand: forcast?.forcast_demand_7 ?? 0,
                      type: "stockout",
                    });
                  } else {
                    await alertService.updateAlert(
                      { sku: skuObj.sku, user: req.userId, type: "stockout" },
                      {
                        quantity: 0,
                        weeklyDemand: forcast?.forcast_demand_7 ?? 0,
                      }
                    );
                  }
                }
              } else {
                console.log("existing forecast nahi mili");
                let forcast = await forcastServices.createForcast(
                  forecastPayloadForDB
                );
                if (skuObj.stock <= 0) {
                  let alert = await alertService.findAlert({
                    sku: skuObj.sku,
                    user: req.userId,
                    type: "stockout",
                  });
                  if (!alert) {
                    await alertService.createAlert({
                      sku: skuObj.sku,
                      user: req.userId,
                      description: skuObj.description,
                      quantity: 0,
                      weeklyDemand: forcast?.forcast_demand_7 ?? 0,
                      type: "stockout",
                    });
                  } else {
                    await alertService.updateAlert(
                      { sku: skuObj.sku, user: req.userId, type: "stockout" },
                      {
                        quantity: 0,
                        weeklyDemand: forcast?.forcast_demand_7 ?? 0,
                      }
                    );
                  }
                }
              }
            })
            .catch((error) => {
              console.error("Error in forecast API:", error);
              // Handle the error as needed
            });
        })
      );
      Response.success(res, "Train data uploaded successfully");
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
      const response = await saleService.topSellingProducts();

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
