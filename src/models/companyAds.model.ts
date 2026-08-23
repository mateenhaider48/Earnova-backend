import mongoose, { Schema, Document } from "mongoose";

export interface CompanyAds extends Document {
  image: string;
}

const CompanyAdsSchema = new Schema<CompanyAds>(
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

const CompanyAds =
  mongoose.models.CompanyAds ||
  mongoose.model<CompanyAds>("CompanyAds", CompanyAdsSchema);

export default CompanyAds;