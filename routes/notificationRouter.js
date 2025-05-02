import express from "express";
const routes = express.Router();
import checkToken from "../middleware/auth.js";
import notificationController from "../controller/notificationController.js";

routes.post(
  "/create",
  checkToken.checkToken,
  notificationController.createNotification
);
routes.put(
  "/update/:id",
  checkToken.checkToken,
  notificationController.updateNotification
);
routes.get(
  "/all",
  checkToken.checkToken,
  notificationController.getUserNotifications
);
routes.delete(
  "/:id",
  checkToken.checkToken,
  notificationController.deleteNotification
);
export default routes;
