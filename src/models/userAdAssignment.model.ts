import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

// =========================================================
// INTERFACE
// =========================================================

export interface IUserAdAssignment
  extends Document {
  user: Types.ObjectId;
  ad: Types.ObjectId;

  assignedAt: Date;
  expiresAt: Date;

  viewedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

// =========================================================
// SCHEMA
// =========================================================

const UserAdAssignmentSchema =
  new Schema<IUserAdAssignment>(
    {
      // ===================================================
      // USER
      // ===================================================

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ===================================================
      // AD
      // ===================================================

      ad: {
        type: Schema.Types.ObjectId,
        ref: "Ad",
        required: true,
        index: true,
      },

      // ===================================================
      // ASSIGNED TIME
      // ===================================================

      assignedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },

      // ===================================================
      // EXPIRATION
      //
      // Assignment exactly 24 hours valid rahegi.
      // ===================================================

      expiresAt: {
        type: Date,
        required: true,
        index: true,
      },

      // ===================================================
      // VIEWED TIME
      //
      // Reward yahan nahi diya ja raha.
      // Sirf ye record hoga ke user ne ad complete dekha.
      // ===================================================

      viewedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

// =========================================================
// INDEX
//
// Same user ko same active cycle mein same ad duplicate
// assignment se bachane ke liye.
//
// Historical assignments next 24-hour cycle mein dobara
// create ho sakti hain.
// =========================================================

UserAdAssignmentSchema.index(
  {
    user: 1,
    ad: 1,
    expiresAt: 1,
  }
);

// =========================================================
// MODEL
// =========================================================

const UserAdAssignment: Model<IUserAdAssignment> =
  mongoose.model<IUserAdAssignment>(
    "UserAdAssignment",
    UserAdAssignmentSchema
  );

export default UserAdAssignment;
