import { Schema, model } from "mongoose";
const saleSchema = new Schema(
  {
    sku: { type: String, required: true },
    id: { type: String, required: true },
    variantId: { type: Schema.Types.ObjectId, ref: "Variant" },
    orderId: { type: String, required: true },
    unitsSold: { type: Number, required: true },
    sales: { type: Number, required: true },
    saleDate: { type: Date, required: true },
    currentInventory: { type: Number, required: true },
    reorderPoint: { type: Number, required: true },
    priceAtSale: { type: Number, required: true },
  },
  { timestamps: true }
);
export default model("Sale", saleSchema);
