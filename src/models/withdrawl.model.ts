import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawal extends Document {
  user: mongoose.Types.ObjectId;
  method: string;
  methodId: mongoose.Types.ObjectId;
  amount: number;
  accountNumber?: string;
  walletAddress?: string;
  accountName?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    method: {
      type: String,
      required: true,
      trim: true,
    },

    methodId: {
      type: Schema.Types.ObjectId,
      ref: "withdrawal",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    accountNumber: {
      type: String,
      trim: true,
    },

    walletAddress: {
      type: String,
      trim: true,
    },

    accountName: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWithdrawal>(
  "Withdrawal",
  withdrawalSchema
);