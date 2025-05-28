import express from "express";
const routes = express.Router();
import checkToken from "../middleware/auth.js";
import alertController from "../controller/alertController.js";

routes.post("/create", alertController.createAlert);
routes.get("/find", alertController.findAlert);
routes.get("/all", checkToken.checkToken, alertController.findAll);
routes.patch("/:alertId", alertController.updateAlert);
routes.delete(
  "/delete/:sku/:type",
  checkToken.checkToken,
  alertController.deleteAlert
);
routes.delete(
  "/allDelete",
  checkToken.checkToken,
  alertController.deleteAllAlerts
);
export default routes;
