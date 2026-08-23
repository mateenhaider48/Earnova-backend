import { Request, Response } from "express";
import mongoose from "mongoose";

import WalletRequest from "../models/wallet.model";
import User from "../models/user.model";

// =========================================================
// GET ALL WALLET REQUESTS
// =========================================================

export const getAllWalletRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const requests = await WalletRequest.find()
      .populate("user", "name cellNo email balance")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Wallet requests fetched successfully.",
      data: requests,
    });
  } catch (error) {
    console.error(
      "Get All Wallet Requests Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching wallet requests.",
    });
  }
};

// =========================================================
// APPROVE WALLET REQUEST
// =========================================================

export const approveWalletRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
   const id = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;
    // -----------------------------------------------------
    // VALIDATE REQUEST ID
    // -----------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
      return;
    }

    // -----------------------------------------------------
    // FIND REQUEST
    // -----------------------------------------------------

    const request = await WalletRequest.findById(id)

    if (!request) {

      res.status(404).json({
        success: false,
        message: "Wallet request not found.",
      });

      return;
    }

    // -----------------------------------------------------
    // ONLY PENDING REQUEST
    // -----------------------------------------------------

    if (request.status !== "pending") {

      res.status(400).json({
        success: false,
        message: `Request is already ${request.status}.`,
      });

      return;
    }

    // -----------------------------------------------------
    // FIND USER
    // -----------------------------------------------------

    const user = await User.findById(request.user)

    if (!user) {
  
      res.status(404).json({
        success: false,
        message: "User not found.",
      });

      return;
    }

    // -----------------------------------------------------
    // VALIDATE AMOUNT
    // -----------------------------------------------------

    const amount = Number(request?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {

      res.status(400).json({
        success: false,
        message: "Invalid request amount.",
      });

      return;
    }

    // =====================================================
    // DEPOSIT
    // =====================================================

    if (request.type === "deposit") {
      const currentBalance = Number(user.balance || 0);

      user.balance = currentBalance + amount;
    }

    // =====================================================
    // WITHDRAW
    // =====================================================

    else if (request.type === "withdraw") {
      const currentBalance = Number(user.balance || 0);

      if (currentBalance < amount) {
    
        res.status(400).json({
          success: false,
          message: "User does not have sufficient balance.",
        });

        return;
      }

      user.balance = currentBalance - amount;
    }

    // =====================================================
    // INVALID TYPE
    // =====================================================

    else {

      res.status(400).json({
        success: false,
        message: "Invalid wallet request type.",
      });

      return;
    }

    // -----------------------------------------------------
    // SAVE USER BALANCE
    // -----------------------------------------------------

    await user.save();

    // -----------------------------------------------------
    // APPROVE REQUEST
    // -----------------------------------------------------

    request.status = "approved";

    await request.save();

 
    res.status(200).json({
      success: true,
      message:
        request.type === "deposit"
          ? "Deposit request approved and balance added successfully."
          : "Withdrawal request approved and balance deducted successfully.",
      data: {
        requestId: request._id,
        userId: user._id,
        type: request.type,
        amount,
        status: request.status,
        balance: user.balance,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error(
      "Approve Wallet Request Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while approving wallet request.",
    });
  } finally {
    await session.endSession();
  }
};

// =========================================================
// REJECT WALLET REQUEST
// =========================================================

export const rejectWalletRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
   const id = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;

    // -----------------------------------------------------
    // VALIDATE REQUEST ID
    // -----------------------------------------------------

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });

      return;
    }

    // -----------------------------------------------------
    // FIND REQUEST
    // -----------------------------------------------------

    const request = await WalletRequest.findById(id);

    if (!request) {
      res.status(404).json({
        success: false,
        message: "Wallet request not found.",
      });

      return;
    }

    // -----------------------------------------------------
    // ONLY PENDING REQUEST CAN BE REJECTED
    // -----------------------------------------------------

    if (request.status !== "pending") {
      res.status(400).json({
        success: false,
        message: `Request is already ${request.status}.`,
      });

      return;
    }

    // -----------------------------------------------------
    // REJECT REQUEST
    // -----------------------------------------------------

    request.status = "rejected";

    await request.save();

    res.status(200).json({
      success: true,
      message: "Wallet request rejected successfully.",
      data: {
        requestId: request._id,
        type: request.type,
        amount: request.amount,
        status: request.status,
      },
    });
  } catch (error) {
    console.error(
      "Reject Wallet Request Error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while rejecting wallet request.",
    });
  }
};