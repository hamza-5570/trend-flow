import { Schema, model } from 'mongoose';

const alertSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inventory: {
      type: Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    type: {
      type: String,
      enum: ['stockout', 'overstock'],
      required: true,
    },
  },
  { timestamps: true }
);

export default model('Alert', alertSchema);
