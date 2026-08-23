import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export interface ISubscription extends Document {
  planName: string;
  amount: number;
  dailyAds: number;
  amountPerAd: number;
  planTimeLimit: number; // days
  isActive: boolean;

  // Optional plan image
  planImage?: string | null;
   activePlanImage?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema =
  new Schema(
    {
      planName: {
        type: String,
        required: true,
        trim: true,
      },

      amount: {
        type: Number,
        required: true,
        min: 0,
      },

      dailyAds: {
        type: Number,
        required: true,
        min: 1,
      },

      amountPerAd: {
        type: Number,
        required: true,
        min: 0,
      },

      // Plan duration in days
      planTimeLimit: {
        type: Number,
        required: true,
        min: 1,
      },
  
      // Admin can activate/deactivate plan
      isActive: {
        type: Boolean,
        default: true,
      },

      // Optional plan image
      planImage: {
        type: String,
        default: null,
      },
        activePlanImage: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: true,
    },
  );

const Subscription: Model<ISubscription> =
  mongoose.model<ISubscription>(
    "Subscription",
    SubscriptionSchema,
  );

export default Subscription;
