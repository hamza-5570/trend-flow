import { Schema, model } from "mongoose";

const inventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
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
    reorderPoint: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default model("Inventory", inventorySchema);
