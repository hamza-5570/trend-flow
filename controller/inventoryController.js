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
      const forecastBaseUrl = "http://0.0.0.0:8000/make-forecast";

      for (const item of req.csvData) {
        // 1. Check if inventory exists
        let inventory = await inventoryServices.findInventoryId({
          sku: item.sku,
        });

        if (!inventory) {
          inventory = await inventoryServices.createInventory({
            sku: item.sku,
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
            { sku: item.sku },
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
        }

        // 2. Check if sales exist for SKU
        const sales = await saleService.findSale({ sku: item.sku });

        if (sales) {
          // 3. Prepare forecast payload
          const forecastPayload = [
            {
              sku: item.sku,
              product_title: item.description,
              category: item.category,
              subcategory: item.subcategory,
              price: item.price,
              material: item.material,
              gender_age: item.gender_age,
              current_inventory: item.stock,
              start_day: Date.now(),
              end_day: Date.now() + 1000 * 60 * 60 * 24 * 90, // 90 days
            },
          ];

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

          // 5. Handle Forecast Response
          const forecastData = forecastResponse.data;
          const reorderMessage = forecastData[0] || "";
          const overstockMessage = forecastData[1] || "";
          const demandForecast = forecastData[2] || [];

          const days_demand_30 = demandForecast.slice(0, 30);
          const days_demand_60 = demandForecast.slice(0, 60);
          const days_demand_90 = demandForecast.slice(0, 90);

          // 6. Prepare forecast payload for DB
          const forecastPayloadForDB = {
            sku: item.sku,
            userId: req.user._id,
            category: item.category,
            reorder_message: reorderMessage,
            overstock_message: overstockMessage,
            forcast_demand: demandForecast,
            days_demand_30,
            days_demand_60,
            days_demand_90,
          };

          // 7. Save or Update Forecast
          const existingForecast = await forcastServices.findForcast({
            sku: item.sku,
          });

          if (existingForecast) {
            await forcastServices.updateForcast(
              { sku: item.sku, userId: req.user._id },
              forecastPayloadForDB
            );
          } else {
            await forcastServices.createForcast(forecastPayloadForDB);
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
