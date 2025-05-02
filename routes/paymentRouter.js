import express from "express";
const routes = express.Router();
import checkToken from "../middleware/auth.js";
import paymentValid from "../validation/paymentValid.js";
import paymentController from "../controller/paymentController.js";

routes.post(
  "/create",
  checkToken.checkToken,
  paymentValid.createPayment,
  paymentController.createPayment
);
routes.get("/all", checkToken.checkToken, paymentController.findAll);
routes.get("/find", paymentController.findPayment);
routes.get("/:paymentId", paymentController.findPaymentId);
routes.patch("/:paymentId", paymentController.updatePayment);
routes.delete("/:paymentId", paymentController.deletePayment);
routes.post(
  "/create-payment-intent",
  checkToken.checkToken,
  paymentValid.createPayment,
  paymentController.paymentIntent
);

export default routes;
