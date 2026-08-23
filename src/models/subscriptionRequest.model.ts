import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

// ============================================================
// SUBSCRIPTION REQUEST INTERFACE
// ============================================================

export interface ISubscriptionRequest
  extends Document {
  user: Types.ObjectId;

  // New plan
  plan: Types.ObjectId;
  planName: string;

  // Current active plan
  hasActivePlan: boolean;
  currentPlan: Types.ObjectId | null;
  currentPlanName: string | null;
  currentPlanPrice: number;

  // New plan/payment
  newPlanPrice: number;
  amount: number;

  paymentMethod:
    | "balance"
    | "jazzcash"
    | "easypaisa"
    | "bank"
    | "usdt"
    | "other";

  paymentMethodId: Types.ObjectId | null;
  paymentMethodName: string | null;
  paymentAccountNumber: string | null;

  transactionId: string | null;
  receipt: string | null;

  status:
    | "pending"
    | "approved"
    | "rejected";

  purpose: "subscription";

  rejectionReason: string | null;

  approvedBy: Types.ObjectId | null;
  approvedAt: Date | null;

  rejectedBy: Types.ObjectId | null;
  rejectedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// SCHEMA
// ============================================================

const SubscriptionRequestSchema =
  new Schema<ISubscriptionRequest>(
    {
      // ======================================================
      // USER
      // ======================================================

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ======================================================
      // NEW PLAN
      // ======================================================

      plan: {
        type: Schema.Types.ObjectId,
        ref: "Subscription",
        required: true,
      },

      planName: {
        type: String,
        required: true,
        trim: true,
      },

      // ======================================================
      // CURRENT PLAN
      // ======================================================

      hasActivePlan: {
        type: Boolean,
        default: false,
      },

      currentPlan: {
        type: Schema.Types.ObjectId,
        ref: "Subscription",
        default: null,
      },

      currentPlanName: {
        type: String,
        default: null,
      },

      currentPlanPrice: {
        type: Number,
        default: 0,
        min: 0,
      },

      // ======================================================
      // NEW PLAN / PAYMENT AMOUNT
      // ======================================================

      newPlanPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      // ======================================================
      // PAYMENT
      // ======================================================

      paymentMethod: {
        type: String,
        enum: [
          "balance",
          "jazzcash",
          "easypaisa",
          "bank",
          "usdt",
          "other",
        ],
        required: true,
      },

      paymentMethodId: {
        type: Schema.Types.ObjectId,
        default: null,
      },

      paymentMethodName: {
        type: String,
        default: null,
      },

      paymentAccountNumber: {
        type: String,
        default: null,
      },

      transactionId: {
        type: String,
        default: null,
      },

      receipt: {
        type: String,
        default: null,
      },

      // ======================================================
      // STATUS
      // ======================================================

      status: {
        type: String,
        enum: [
          "pending",
          "approved",
          "rejected",
        ],
        default: "pending",
        index: true,
      },

      purpose: {
        type: String,
        enum: ["subscription"],
        default: "subscription",
        required: true,
      },

      // ======================================================
      // REJECTION
      // ======================================================

      rejectionReason: {
        type: String,
        default: null,
      },

      // ======================================================
      // APPROVAL
      // ======================================================

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      // ======================================================
      // REJECTION INFO
      // ======================================================

      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    },
  );

// ============================================================
// MODEL
// ============================================================

export const SubscriptionRequest: Model<ISubscriptionRequest> =
  mongoose.models.SubscriptionRequest ||
  mongoose.model<ISubscriptionRequest>(
    "SubscriptionRequest",
    SubscriptionRequestSchema,
  );

export default SubscriptionRequest;