import mongoose, { Document, Schema } from "mongoose";

export interface ITutorial extends Document {
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: Date;
  updatedAt: Date;
}

const tutorialSchema = new Schema<ITutorial>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tutorial =
  mongoose.models.Tutorial ||
  mongoose.model<ITutorial>("Tutorial", tutorialSchema);

export default Tutorial;