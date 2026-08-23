import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

// =========================================================
// AD INTERFACE
// =========================================================

export interface IAd extends Document {
  title: string;
  description?: string;

  type: "image" | "video";

  mediaUrl: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =========================================================
// AD SCHEMA
// =========================================================

const AdSchema: Schema<IAd> = new Schema(
  {
    // =====================================================
    // TITLE
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // DESCRIPTION
    // =====================================================

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // IMAGE / VIDEO
    // =====================================================

    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    // =====================================================
    // CLOUDINARY MEDIA URL
    // =====================================================

    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // ACTIVE / INACTIVE
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// MODEL
// =========================================================

const Ad: Model<IAd> = mongoose.model<IAd>(
  "Ad",
  AdSchema
);

export default Ad;
