import mongoose, { Schema, model } from 'mongoose';
const notificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    message: { type: String, required: true },
  },
  { timestamps: true }
);
export default model('Notification', notificationSchema);
