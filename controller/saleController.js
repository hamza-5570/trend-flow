import mongoose from "mongoose";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import saleService from "../services/saleService.js";
import productService from "../services/productService.js";
import notificationService from "../services/notificationService.js";
import inventoryService from "../services/inventoryService.js";
class saleController {
  createSaleWithCSV = async (req, res) => {
    try {
      const salePromises = req.csvData.map(async (sale) => {
        let product = await productService.filter({ sku: sale.SKU });
        if (!product) {
          await notificationService.createNotification({
            message: `Product ${sale.ProductTitle} is not availabe in our database`,
            productId: sale.Productid,
            userId: req.user._id,
          });
        } else {
          let sales = await saleService.createSale({
            sku: sale.SKU,
            productId: new mongoose.Types.ObjectId(sale.Productid),
            orderId: sale.OrderId,
            unitsSold: sale.UnitsSold,
            sales: sale.Sales,
            saleDate: sale.SaleDate,
            currentInventory: sale.CurrentInventory,
            reorderPoint: sale.ReorderPoint,
            priceAtSale: sale.Price,
          });

          console.log("Sales Created", sales);

          let inventory = await inventoryService.updateInventory(
            {
              productId: new mongoose.Types.ObjectId(sale.Productid),
              size: sale.Size,
              color: sale.Color,
              reorderPoint: sale.ReorderPoint,
            },
            {
              stock: sale.CurrentInventory,
            }
          );

          console.log("Inventory Updated", inventory);
        }
      });

      await Promise.all(salePromises);
      Response.success(res, messageUtil.SUCCESS);
    } catch (error) {
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
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new saleController();
