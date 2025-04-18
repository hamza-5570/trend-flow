import axios from "axios";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import inventoryServices from "../services/inventoryService.js";
import Inventory from "../model/inventory.js";
import notificationService from "../services/notificationService.js";
import saleService from "../services/saleService.js";
// import productService from '../services/productService.js';
import csv from "csv-parser";
import fs from "fs";
import forcastServices from "../services/forcastServices.js";

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
      const forecastBaseUrl = "http://0.0.0.0:8000/make-forecast";
      for (const item of req.csvData) {
        console.log("Item:", item);
        // 1. Check if inventory exists
        let inventory = await inventoryServices.findInventoryId({
          sku: item.SKU,
        });

        if (!inventory) {
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
        } else {
          await inventoryServices.updateInventory(
            { sku: item.SKU },
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
          const sales = await saleService.findSale({ sku: item.SKU });

          if (sales) {
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

            console.log("Forecast Payload:", forecastPayload);
            // 4. Send to Forecast API
            const forecastResponse = await axios.post(
              forecastBaseUrl,
              forecastPayload,
              {
                headers: {
                  authorization: "hashbin2",
                },
              }
            );
            console.log(forecastResponse.data);
            const sumForecast = (arr) =>
              arr.reduce((sum, entry) => sum + (entry.forecast || 0), 0);

            // Destructure the response
            const [reorderMessage, overstockMessage, forecastArray] =
              forecastResponse.data;

            // Safely slice and calculate
            const days_demand_30 = sumForecast(forecastArray.slice(0, 30));
            const days_demand_60 = sumForecast(forecastArray.slice(0, 60));
            const days_demand_90 = sumForecast(forecastArray.slice(0, 90));
            const demandForecast = sumForecast(forecastArray);
            // 6. Prepare forecast payload for DB
            const forecastPayloadForDB = {
              sku: item.SKU,
              userId: req.userId,
              category: item.Category,
              forcast_demand: demandForecast,
              days_demand_30,
              days_demand_60,
              days_demand_90,
            };

            // 7. Save or Update Forecast
            const existingForecast = await forcastServices.findForcast({
              sku: item.SKU,
            });

            if (existingForecast) {
              await forcastServices.updateForcast(
                { sku: item.SKU, userId: req.userId },
                forecastPayloadForDB
              );
            } else {
              await forcastServices.createForcast(forecastPayloadForDB);
            }
          }
        }
      }

      return Response.success(res, messageUtil.OK);
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
