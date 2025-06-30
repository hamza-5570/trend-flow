import { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    sku: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stockInDate: {
      type: Date,
    },
    stockOutDate: {
      type: Date,
    },
    weeklyDemand: {
      type: Number,
    },
    size: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    gender_age: {
      type: String,
    },
    material: {
      type: String,
      required: true,
    },
    lead_time: {
      type: Number,
      default: 7,
    },
    safety_stock: {
      type: Number,
      default: 20,
    },
    // reorderPoint: {
    //   type: Number,
    //   required: true,
    // },
  },
  { timestamps: true }
);

export default model("Inventory", inventorySchema);
