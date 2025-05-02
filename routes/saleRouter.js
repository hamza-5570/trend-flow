import express from "express";
const routes = express.Router();
import checkToken from "../middleware/auth.js";
import saleController from "../controller/saleController.js";
import { csvUploadMiddleware } from "../middleware/readCsv.js";
routes.post(
  "/uploadCsvSales",
  checkToken.checkToken,
  csvUploadMiddleware,
  saleController.createSaleWithCSV
);
routes.get(
  "/top-selling-products",
  // authToken.authenticateUser,
  saleController.TopSku
);
export default routes;
