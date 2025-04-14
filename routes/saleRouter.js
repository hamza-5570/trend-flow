import express from "express";
const routes = express.Router();
import authToken from "../middleware/auth.js";
import saleController from "../controller/saleController.js";
import { csvUploadMiddleware } from "../middleware/readCsv.js";
routes.post(
  "/uploadCsvSales",
  authToken.authenticateUser,
  csvUploadMiddleware,
  saleController.createSaleWithCSV
);

export default routes;
