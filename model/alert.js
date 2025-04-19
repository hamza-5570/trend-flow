import { Schema, model } from "mongoose";

const alertSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    weeklyDemand: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["stockout", "overstock", "reorder"],
      required: true,
    },
  },
  { timestamps: true }
);

export default model("Alert", alertSchema);
