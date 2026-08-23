import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

const JWT_SECRET = "1a8c501f305c9a289d82a609a6df34500fab870fb4acb480c9b5c60d97cd8e38a9774a3c848eefbdd2502b8376f0fbeaa7f0b3b74f845f86ace93a033878f8aa"
type UserRole = "user" | "admin";

const JWT_REFRESH_SECRET = "ec8131ccdf81436cd06494a42b0bdda06a0059cce4c97dd12c4450a7cec369ae3d00c6c240cfd408df8afaa461e0d1ea06157f088de33d530f635146b1e79373"

export const generateToken = (
  userId: Types.ObjectId | string,
  role: UserRole
): string => {
  return jwt.sign(
    {
      id: userId.toString(),
      role,
    },
    JWT_SECRET as Secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    }
  );
};

export const genRefreshToken = (
  userId: Types.ObjectId | string,
  role: UserRole
): string => {
  return jwt.sign(
    {
      id: userId.toString(),
      role,
    },
   JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    }
  );
};