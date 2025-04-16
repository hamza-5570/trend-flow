import axios from "axios";
import FormData from "form-data";
import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import saleService from "../services/saleService.js";
import productService from "../services/productService.js";
import notificationService from "../services/notificationService.js";
import inventoryService from "../services/inventoryService.js";
class saleController {
  createSaleWithCSV = async (req, res) => {
    try {
      console.log("CSV Data", req.file);
      const form = new FormData();

      form.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const response = await axios.post(
        "http://0.0.0.0:8000/upload-train-data",
        form,
        {
          headers: {
            authorization: "hashbin2",
          },
        }
      );

      console.log("Upload successful:", response.data);
      const salePromises = req.csvData.map(async (sale) => {
        let product = await productService.findProduct({ sku: sale.SKU });
        if (!product) {
          await notificationService.createNotification({
            message: `Product ${sale.ProductTitle} is not availabe in our database`,
            userId: req.user._id,
          });
        } else {
          let sales = await saleService.createSale({
            sku: sale.SKU,
            id: sale.Productid,
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
              sku: sale.SKU,
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
      Response.success(res, messageUtil.OK, response);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
}

export default new saleController();
