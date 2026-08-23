import mongoose, { Document, Schema } from "mongoose";

export interface IWalletRequest extends Document {
  user: mongoose.Types.ObjectId;
  type: "deposit" | "withdraw";
  amount: number;
  paymentNumber?: string;
  transactionId?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletRequestSchema = new Schema<IWalletRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentNumber: {
      type: String,
      trim: true,
      default: null,
    },

    transactionId: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const WalletRequest = mongoose.model<IWalletRequest>(
  "WalletRequest",
  walletRequestSchema,
);

export default WalletRequest;