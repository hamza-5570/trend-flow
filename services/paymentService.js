import paymentSchema from "../model/payment.js";

class paymentCRUD {
  createPayment = async (query) => {
    return await paymentSchema.create(query);
  };
  findAll = async (query) => {
    return await paymentSchema.find(query).populate("user", "name email");
  };
  findPayment = async (query) => {
    return await paymentSchema.find(query);
  };
  findPaymentId = async (paymentId) => {
    return await paymentSchema
      .findById(paymentId)
      .populate("user", "name email");
  };
  updatePayment = async (query, data) => {
    return await paymentSchema.findByIdAndUpdate(query, data, { new: true });
  };
  deletePayment = async (query) => {
    return await paymentSchema.findOneAndDelete(query);
  };
}
export default new paymentCRUD();
