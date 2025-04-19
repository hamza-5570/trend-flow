import mongoose, { Schema, model } from "mongoose";
const productSchema = new Schema(
  {
    sku: { type: String, required: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    material: { type: String, required: true },
  },
  { timestamps: true }
);
export default model("Product", productSchema);
