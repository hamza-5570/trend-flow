import express from "express";
const routes = express.Router();
import auth from "../middleware/auth.js";
import alertController from "../controller/alertController.js";

routes.post("/create", alertController.createAlert);
routes.get("/find", alertController.findAlert);
routes.get("/all", auth.authenticateUser, alertController.findAll);
routes.patch("/:alertId", alertController.updateAlert);
routes.delete("/:alertId", alertController.deleteAlert);
export default routes;
