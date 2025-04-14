import Response from '../utilities/response.js';
import messageUtil from '../utilities/message.js';
import inventoryServices from '../services/inventoryService.js';
import Inventory from '../model/inventory.js';
import notificationService from '../services/notificationService.js';
import Product from '../model/product.js';
// import productService from '../services/productService.js';
import csv from 'csv-parser';
import fs from 'fs';

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

  updateInventory = async (req, res) => {
    try {
      const response = await inventoryServices.updateInventory(
        req.params.inventoryId,
        req.body
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
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

  LowStock = async (req, res) => {
    try {
      const lowStockItems = await inventoryServices.findAll(
        { stock: 0 }
        // $or: [
        //   { stock: 0 },
        //   {
        //     $expr: { $lte: ['$stock', '$weeklyDemand'] },
        //   },
        // ],
      );
      if (lowStockItems.length === 0) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
      }
      return Response.success(res, messageUtil.STOCK_OUT, lowStockItems);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };

  UpdateStock = async (req, res) => {
    const { update } = req.body;
    try {
      const updateInventory = [];
      for (const { product, stock } of update) {
        let inventory = await inventoryServices.findInventoryId({ product });
        if (inventory) {
          inventory.stock += stock;
          inventory.stockInDate = new Date();
        } else {
          return Response.notfound(res, messageUtil.NOT_FOUND);
        }
        await inventory.save();
        updateInventory.push(inventory);
      }
      return Response.success(res, messageUtil.OK, updateInventory);
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
  findInventory = async (req, res) => {
    try {
      const { productId } = req.params;
      const inventory = await inventoryServices.findInventoryId({
        product: productId,
      });
      if (!inventory) {
        return Response.notfound(res, messageUtil.NOT_FOUND);
        // return res.status(404).json({ message: 'Inventory not found' });
      }
      return Response.success(res, messageUtil.OK, inventory);
      // res.json(inventory);
    } catch (error) {
      return Response.serverError(res, error);
      // res.status(500).json({ error: error.message });
    }
  };
  updateInventoryByCSV = async (req, res) => {
    if (!req.file) {
      return Response.badRequest(res, 'No file uploaded.');
    }

    const filePath = req.file.path;
    const updates = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        updates.push(row);
      })
      .on('end', async () => {
        const notFoundProducts = [];

        for (const item of updates) {
          const { product, stock, stockOutDate, stockInDate, weeklyDemand } =
            item;

          // 🔍 Check if inventory exists with the given productId
          const existingInventory = await inventoryServices.findInventory({
            product: product, // ✅ product is already productId from CSV
          });

          if (!existingInventory) {
            notFoundProducts.push(product);

            // 🔔 Create notification about missing inventory
            await notificationService.createNotification({
              userId: req.user._id,
              productId: product,
              message: `Product ID "${product}" not found in inventory during CSV upload.`,
            });

            continue;
          }

          // ✅ Update existing inventory
          await inventoryServices.updateInventory(
            { product: product },
            {
              stock: Number(stock),
              stockOutDate: new Date(stockOutDate),
              stockInDate: new Date(stockInDate),
              weeklyDemand: Number(weeklyDemand),
            },
            { upsert: true }
          );
        }

        fs.unlinkSync(filePath); // Cleanup uploaded CSV

        if (notFoundProducts.length > 0) {
          return Response.notfound(res, {
            message: 'Some products were not found in the inventory.',
            notFoundProducts,
          });
        }

        return Response.success(res, messageUtil.UPDATE);
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        return Response.serverError(res, error);
      });
  };
  // pagination of low stock
  HighStock = async (req, res) => {
    try {
      let { page, limit } = req.query;
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {
        $expr: { $gt: ['$stock', { $multiply: ['$weeklyDemand', 2] }] },
      };

      const totalCount = await Inventory.countDocuments(filter);
      const highStockItems = await inventoryServices.findAll(filter, {
        skip,
        limit,
      });

      if (highStockItems.length === 0) {
        return Response.success(res, messageUtil.NO_HIGH_STOCK, {
          totalCount,
          data: [],
        });
      }

      return Response.success(res, messageUtil.SUCCESS, {
        totalCount,
        page,
        // limit,
        totalPages: Math.ceil(totalCount / limit),
        data: highStockItems,
      });
    } catch (error) {
      return Response.serverError(res, error);
    }
  };
}

export default new inventoryController();
