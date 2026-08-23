import mongoose, { Schema, Document } from "mongoose";

export interface IIncome extends Document {
  image: string;
}

const incomeSchema = new Schema<IIncome>(
  {
    image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Income =
  mongoose.models.Income ||
  mongoose.model<IIncome>("Income", incomeSchema);

export default Income;