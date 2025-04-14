import Response from "../utilities/response.js";
import messageUtil from "../utilities/message.js";
import userServices from "../services/userService.js";
import paymentServices from "../services/paymentService.js";
import Payment from "../model/payment.js";
import Stripe from "stripe";
const dotenv = await import("dotenv");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

class paymentController {
  createPayment = async (req, res) => {
    try {
      console.log(req.userId);
      const response = await paymentServices.createPayment({
        ...req.body,
        user: req.userId,
      });
      await userServices.updateUser(
        { _id: req.userId },
        { isSubscribed: true }
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findAll = async (req, res) => {
    try {
      const response = await paymentServices.findAll(req.query);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findPayment = async (req, res) => {
    try {
      const response = await paymentServices.findPayment(req.query);
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  findPaymentId = async (req, res) => {
    try {
      const response = await paymentServices.findPaymentId(
        req.params.paymentId
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  updatePayment = async (req, res) => {
    try {
      const response = await paymentServices.updatePayment(
        req.params.paymentId,
        req.body
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };

  deletePayment = async (req, res) => {
    try {
      const response = await paymentServices.deletePayment(
        req.params.paymentId
      );
      Response.success(res, response, messageUtil.SUCCESS);
    } catch (error) {
      Response.serverError(res, error);
    }
  };
  paymentIntent = async (req, res) => {
    try {
      const { amount, currency, paymentMethodId, userId, type } = req.body;

      if (!userId) {
        return Response.badRequest(res, messageUtil.REQUIRED_USER_ID);
        // return res
        //   .status(400)
        //   .json({ success: false, error: 'User ID is required' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount, // Amount in cents
        currency,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: "https://wishpostings.com/", // Automatically confirm the payment
      });

      // Save payment details
      const paymentData = await paymentServices.createPayment({
        user: userId, // Ensure the correct user ID is stored
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        type,
        status: paymentIntent.status,
        transactionId: paymentIntent.id,
        paymentMethod: paymentMethodId,
      });

      // Update user subscription only if payment succeeds
      if (paymentIntent.status === "succeeded") {
        await userServices.updateUser({ _id: userId }, { isSubscribed: true });
      }

      return Response.success(res, messageUtil.OK, {
        clientSecret: paymentIntent.client_secret,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
        paymentData,
      });
    } catch (error) {
      console.error("Payment Error:", error);
      return Response.serverError(res, error);
    }
  };
}

export default new paymentController();
