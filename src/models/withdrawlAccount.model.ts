import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawalAccount extends Document {
  user: mongoose.Types.ObjectId;
  methodId: mongoose.Types.ObjectId;
  methodName: string;
  accountNumber?: string;
  walletAddress?: string;
  accountName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalAccountSchema =
  new Schema<IWithdrawalAccount>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      methodId: {
        type: Schema.Types.ObjectId,
        ref: "PaymentSetting",
        required: true,
      },

      methodName: {
        type: String,
        required: true,
        trim: true,
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
    },
    {
      timestamps: true,
    }
  );

withdrawalAccountSchema.index(
  { user: 1, methodId: 1 },
  { unique: true }
);

export default mongoose.model<IWithdrawalAccount>(
  "WithdrawalAccount",
  withdrawalAccountSchema
);