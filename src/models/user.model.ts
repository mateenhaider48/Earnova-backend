import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IUser extends Document {
  name: string;
  cellNo: string;
  password: string;

  reflink: string | null;
  refBy: string | null;

  otp: string | null;
  otpExpiry: Date | null;

  role: "user" | "admin";

  // ============================================================
  // SUBSCRIPTION
  // ============================================================

  subscription: Types.ObjectId | null;

  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;

  /**
   * Original amount reserved for the currently active plan.
   *
   * Example:
   * balance = 2100
   * lockedSubscriptionAmount = 2000
   *
   * Available balance = 100
   */
  lockedSubscriptionAmount: number;

  /**
   * Amount/value remaining from current subscription.
   *
   * Example:
   * Plan = 2000
   * Used 10 days
   * Remaining value = 1333
   */
  remainingSubscriptionValue: number;

  recharge: number;
  withdrawl: number;

  // ============================================================
  // EARNING CYCLE
  // ============================================================

  earningCycleStart: Date | null;
  earningCycleEnd: Date | null;

  watchedInCurrentCycle: number;

  // ============================================================
  // WALLET
  // ============================================================

  balance: number;
  earning: number;

  status: "active" | "deactive" | "banned";

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    // ==========================================================
    // BASIC
    // ==========================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    cellNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    reflink: {
      type: String,
      default: null,
    },

    refBy: {
      type: String,
      default: null,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpiry: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },

    // ==========================================================
    // SUBSCRIPTION
    // ==========================================================

    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    subscriptionStartDate: {
      type: Date,
      default: null,
    },

    subscriptionEndDate: {
      type: Date,
      default: null,
    },

    // ==========================================================
    // LOCKED SUBSCRIPTION AMOUNT
    // ==========================================================

    lockedSubscriptionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // REMAINING SUBSCRIPTION VALUE
    // ==========================================================

    remainingSubscriptionValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // RECHARGE / WITHDRAW
    // ==========================================================

    recharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    withdrawl: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // EARNING CYCLE
    // ==========================================================

    earningCycleStart: {
      type: Date,
      default: null,
    },

    earningCycleEnd: {
      type: Date,
      default: null,
    },

    watchedInCurrentCycle: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // WALLET
    // ==========================================================

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    earning: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================================================
    // STATUS
    // ==========================================================

    status: {
      type: String,
      enum: ["active", "deactive", "banned"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);

export default User;