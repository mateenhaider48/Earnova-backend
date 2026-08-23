import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  resetPassword,
  changePassword
} from "../controllers/auth.controller";

import authCheck from "../middleware/authCheck.middleware";

const router = Router();

// Authentication
router.post("/signup", registerUser);
router.post("/signin", loginUser);

// Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyForgotPasswordOtp);
router.post("/resend-otp", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/change-password", authCheck, changePassword);
// Logout
router.post("/logout", authCheck, logoutUser);

export default router;