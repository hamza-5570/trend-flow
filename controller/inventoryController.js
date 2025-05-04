import plimit from "p-limit";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import productService from "../services/productService.js";
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
      // 1. Deduplicate by SKU
      const uniqueDataMap = new Map();
      req.csvData.forEach((item) => {
        const trimmedSku = item?.SKU?.trim?.();
        if (!uniqueDataMap.has(trimmedSku)) {
          uniqueDataMap.set(trimmedSku, item);
        }
      });

      const uniqueItems = Array.from(uniqueDataMap.values());
      console.log("Unique Items:", uniqueItems);
      // 2. Limit concurrency (e.g., 5 at a time)
      const limit = plimit(5);

      // 3. Process with controlled concurrency
      const promises = uniqueItems.map((item) =>
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
          }
        })
      );

      await Promise.all(promises);

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
