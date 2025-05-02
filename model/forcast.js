import { Schema, model } from "mongoose";

const forecastSchema = new Schema(
  {
    sku: { type: String, required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: { type: String, required: true },
    description: { type: String, required: true },
    forcast_demand: { type: Number, required: true },
    forcast_demand_7: { type: Number, required: true },
    days_demand_30: { type: Number, required: true },
    days_demand_60: { type: Number, required: true },
    days_demand_90: { type: Number, required: true },
  },
  { timestamps: true }
);

export default model("Forecast", forecastSchema);
