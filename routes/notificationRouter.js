import express from 'express';
const routes = express.Router();
import middleware from '../middleware/auth.js';
import notificationController from '../controller/notificationController.js';
routes.get(
  '/all',
  middleware.authenticateUser,
  notificationController.getUserNotifications
);
routes.delete(
  '/:id',
  middleware.authenticateUser,
  notificationController.deleteNotification
);
export default routes;
