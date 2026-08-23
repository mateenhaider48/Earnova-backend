import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawalMethod extends Document {
  paymentName: string | null;
  paymentImage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const withdrawalMethodSchema = new Schema<IWithdrawalMethod>(
  {
    paymentName: {
      type: String,
      required: true,
      trim: true,
    },

    paymentImage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const WithdrawalMethod = mongoose.model<IWithdrawalMethod>(
  "WithdrawalMethod",
  withdrawalMethodSchema,
);

export default WithdrawalMethod;