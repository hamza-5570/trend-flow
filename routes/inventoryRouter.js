import express from "express";
const routes = express.Router();
import inventoryController from "../controller/inventoryController.js";
// import inventoryValid from "../validation/inventoryValid.js";
import { csvUploadMiddleware } from "../middleware/readCsv.js";
import middleware from "../middleware/auth.js";

routes.post(
  "/create",
  middleware.authenticateToken,
  //   inventoryValid.createInventory,
  inventoryController.createInventory
);
routes.get("/all", inventoryController.findAll);
routes.get("/find", inventoryController.findInventoryId);
routes.delete("/:inventoryId", inventoryController.deleteInventory);
routes.post(
  "/uploadInventory",
  middleware.authenticateToken,
  csvUploadMiddleware,
  inventoryController.uploadInventory
);
export default routes;
