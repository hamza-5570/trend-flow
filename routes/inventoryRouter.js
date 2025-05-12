import express from "express";
const routes = express.Router();
import inventoryController from "../controller/inventoryController.js";
// import inventoryValid from "../validation/inventoryValid.js";
import { csvUploadMiddleware } from "../middleware/readCsv.js";
import checkToken from "../middleware/auth.js";

routes.post(
  "/create",
  checkToken.checkToken,
  //   inventoryValid.createInventory,
  inventoryController.createInventory
);
routes.get("/all", checkToken.checkToken, inventoryController.findAll);
routes.get("/find", inventoryController.findInventoryId);
routes.delete("/:inventoryId", inventoryController.deleteInventory);
routes.post(
  "/uploadInventory",
  checkToken.checkToken,
  csvUploadMiddleware,
  inventoryController.uploadInventory
);
export default routes;
