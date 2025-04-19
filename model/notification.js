import mongoose, { Schema, model } from "mongoose";
const notificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    isread: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default model("Notification", notificationSchema);
