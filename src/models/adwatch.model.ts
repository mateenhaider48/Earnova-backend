import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAdWatch extends Document {
  user: Types.ObjectId;
  ad: Types.ObjectId;
  amountEarned: number;
  watchedAt: Date;
}

const AdWatchSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    ad: {
      type: Schema.Types.ObjectId,
      ref: "Ad",
      required: true,
    },

    amountEarned: {
      type: Number,
      required: true,
      min: 0,
    },

    watchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const AdWatch: Model<IAdWatch> = mongoose.model<IAdWatch>(
  "AdWatch",
  AdWatchSchema
);

export default AdWatch;