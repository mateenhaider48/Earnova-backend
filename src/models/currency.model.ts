import mongoose, { Document, Schema } from "mongoose";

export type CurrencyType = "USD" | "PKR";

export interface ICurrency extends Document {
  currency: CurrencyType;
  updatedAt: Date;
  createdAt: Date;
}

const currencySchema = new Schema<ICurrency>(
  {
    currency: {
      type: String,
      enum: ["USD", "PKR"],
      default: "USD",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Currency = mongoose.model<ICurrency>(
  "Currency",
  currencySchema,
);

export default Currency;