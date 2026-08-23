import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentSetting extends Document {
  paymentName: string;
  paymentDetails: string;
  paymentNetwork?: string | null;

  // Normal payment method image / logo
  paymentImage?: string | null;

  // Optional QR code image
  paymentQRCode?: string | null;

  isActive: boolean;
  minAmount?: number;
  maxAmount?: number | null;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSettingSchema: Schema<IPaymentSetting> =
  new Schema(
    {
      paymentName: {
        type: String,
        required: true,
        trim: true,
      },

      paymentDetails: {
        type: String,
        required: true,
        trim: true,
      },

      paymentNetwork: {
        type: String,
        trim: true,
        default: null,
      },

      // Payment method image / logo
      paymentImage: {
        type: String,
        trim: true,
        default: null,
      },

      // Optional QR code image
      paymentQRCode: {
        type: String,
        trim: true,
        default: null,
      },

      isActive: {
        type: Boolean,
        default: true,
      },

      minAmount: {
        type: Number,
        default: 1,
        min: 0,
      },

      maxAmount: {
        type: Number,
        default: null,
        min: 0,
      },
    },
    {
      timestamps: true,
    },
  );

const PaymentSetting: Model<IPaymentSetting> =
  mongoose.models.PaymentSetting ||
  mongoose.model<IPaymentSetting>(
    "PaymentSetting",
    PaymentSettingSchema,
  );

export default PaymentSetting;