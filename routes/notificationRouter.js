import express from "express";
const routes = express.Router();
import middleware from "../middleware/auth.js";
import notificationController from "../controller/notificationController.js";

routes.post(
  "/create",
  middleware.authenticateToken,
  notificationController.createNotification
);
routes.put(
  "/update/:id",
  middleware.authenticateToken,
  notificationController.updateNotification
);
routes.get(
  "/all",
  middleware.authenticateUser,
  notificationController.getUserNotifications
);
routes.delete(
  "/:id",
  middleware.authenticateUser,
  notificationController.deleteNotification
);
export default routes;
