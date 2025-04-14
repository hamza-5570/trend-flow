import express from 'express';
const routes = express.Router();
import middleware from '../middleware/auth.js';
import paymentValid from '../validation/paymentValid.js';
import paymentController from '../controller/paymentController.js';

routes.post(
  '/create',
  middleware.authenticateToken,
  paymentValid.createPayment,
  paymentController.createPayment
);
routes.get('/all', middleware.authenticateToken, paymentController.findAll);
routes.get('/find', paymentController.findPayment);
routes.get('/:paymentId', paymentController.findPaymentId);
routes.patch('/:paymentId', paymentController.updatePayment);
routes.delete('/:paymentId', paymentController.deletePayment);
routes.post(
  '/create-payment-intent',
  paymentValid.createPayment,
  paymentController.paymentIntent
);

export default routes;
