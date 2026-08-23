import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IPaymentRequest extends Document {
  user: Types.ObjectId;

  method: Types.ObjectId;

  amount: number;

  currency: string;

  transactionId?: string;

  screenshot?: string | null;

  status:
    | "pending"
    | "approved"
    | "rejected";

  // Subscription purchase ke liye
  // normal deposit mein null hoga
  planId?: Types.ObjectId | null;
  subscription?: Types.ObjectId | null;

  createdAt: Date;

  updatedAt: Date;
}

const PaymentRequestSchema =
  new Schema<IPaymentRequest>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      method: {
        type: Schema.Types.ObjectId,
        ref: "PaymentSetting",
        required: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        required: true,
        default: "PKR",
        trim: true,
      },

      transactionId: {
        type: String,
        trim: true,
        default: null,
      },

      // ======================================================
      // PLAN ID
      // ======================================================

      planId: {
        type: Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
      },
subscription: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Subscription",
  default: null,
},
      screenshot: {
        type: String,
        default: null,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
      },
    },
    {
      timestamps: true,
    },
  );

const PaymentRequest: Model<IPaymentRequest> =
  mongoose.models.PaymentRequest ||
  mongoose.model<IPaymentRequest>(
    "PaymentRequest",
    PaymentRequestSchema,
  );

export default PaymentRequest;