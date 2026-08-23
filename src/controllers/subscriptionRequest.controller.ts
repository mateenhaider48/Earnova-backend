// ============================================================
// HELPERS
// ============================================================

import mongoose from "mongoose";
import Subscription from "../models/subscription.model";
import User from "../models/user.model";
import { Request, Response, Router } from "express";
import { SubscriptionRequest } from "../models/subscriptionRequest.model";
const getUserId = (req: Request) => {
  const user = (req as any).user;

  return user?._id || user?.id || user?.userId;
};

const getAdminId = (req: Request) => {
  const user = (req as any).user;

  return user?._id || user?.id || user?.userId;
};

// ============================================================
// CALCULATE SUBSCRIPTION AMOUNT
// ============================================================

const calculateAmount = async (user: any, selectedPlan: any) => {
  // ==========================================================
  // USER HAS NO ACTIVE PLAN
  // ==========================================================

  if (
    !user.subscription ||
    !user.subscriptionStartDate ||
    !user.subscriptionEndDate
  ) {
    return {
      hasActivePlan: false,

      currentPlanId: null,
      currentPlanName: null,
      currentPlanPrice: 0,

      usedDays: 0,
      totalDays: selectedPlan.planTimeLimit,

      remainingDays: 0,

      remainingValue: 0,

      newPlanPrice: Number(selectedPlan.amount),

      additionalAmount: Number(selectedPlan.amount),
    };
  }

  // ==========================================================
  // CURRENT PLAN
  // ==========================================================

  const currentPlan = await Subscription.findById(user.subscription);

  if (!currentPlan) {
    throw new Error("Current subscription plan not found.");
  }

  const currentPrice = Number(currentPlan.amount || 0);

  const newPrice = Number(selectedPlan.amount || 0);

  // ==========================================================
  // ONLY UPGRADE
  // ==========================================================

  if (newPrice <= currentPrice) {
    throw new Error("You can only upgrade to a higher priced plan.");
  }

  // ==========================================================
  // DATES
  // ==========================================================

  const startDate = new Date(user.subscriptionStartDate);

  const endDate = new Date(user.subscriptionEndDate);

  const now = new Date();

  const totalDays = Math.max(
    1,
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const usedDays = Math.min(
    totalDays,
    Math.max(
      0,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    ),
  );

  const remainingDays = Math.max(0, totalDays - usedDays);

  // ==========================================================
  // REMAINING VALUE
  // ==========================================================

  const consumedValue = currentPrice * (usedDays / totalDays);

  const remainingValue = Math.max(0, currentPrice - consumedValue);

  const additionalAmount = Math.max(0, newPrice - remainingValue);

  return {
    hasActivePlan: true,

    currentPlanId: currentPlan._id,

    currentPlanName: currentPlan.planName,

    currentPlanPrice: currentPrice,

    usedDays,

    totalDays,

    remainingDays,

    remainingValue,

    newPlanPrice: newPrice,

    additionalAmount,
  };
};

// ============================================================
// CHECK PLAN
// ============================================================

export const checkSubscription = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserId(req);

    const { planId } = req.body;

    // ============================================
    // VALIDATE PLAN ID
    // ============================================

    if (
      !planId ||
      !mongoose.Types.ObjectId.isValid(planId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid planId is required.",
      });
    }

    // ============================================
    // GET USER
    // ============================================

    const user = await User.findById(userId)
      .populate("subscription");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ============================================
    // GET NEW SELECTED PLAN
    // ============================================

    const newPlan = await Subscription.findById(
      planId
    );

    if (!newPlan) {
      return res.status(404).json({
        success: false,
        message: "Selected subscription plan not found.",
      });
    }

    // ============================================
    // NO ACTIVE PLAN
    // ============================================

    if (!user.subscription) {
      return res.status(200).json({
        success: true,

        data: {
          hasActivePlan: false,

          newPlanName: newPlan.planName,
          newPlanPrice: Number(newPlan.amount || 0),

          additionalAmount: Number(
            newPlan.amount || 0
          ),

          usedDays: 0,
          totalDays: 0,
          remainingDays: 0,
          remainingValue: 0,
        },

        message:
          "You don't have an active subscription.",
      });
    }

    // ============================================
    // CURRENT ACTIVE PLAN
    // ============================================

    const currentPlan = user.subscription as any;

    const currentPlanPrice = Number(
      currentPlan.amount || 0
    );

    const newPlanPrice = Number(
      newPlan.amount || 0
    );

    // ============================================
    // SAME PLAN CHECK
    // ============================================

    if (
      currentPlan._id.toString() ===
      newPlan._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You already have this subscription plan active.",
      });
    }

    // ============================================
    // ADDITIONAL AMOUNT
    // ============================================

    const additionalAmount = Math.max(
      0,
      newPlanPrice - currentPlanPrice
    );

    // ============================================
    // DAYS CALCULATION
    // ============================================

    const now = new Date();

    const startDate =
      user.subscriptionStartDate
        ? new Date(user.subscriptionStartDate)
        : null;

    const endDate =
      user.subscriptionEndDate
        ? new Date(user.subscriptionEndDate)
        : null;

    let usedDays = 0;
    let totalDays = 0;
    let remainingDays = 0;

    if (startDate && endDate) {
      const totalMilliseconds =
        endDate.getTime() -
        startDate.getTime();

      const usedMilliseconds =
        now.getTime() -
        startDate.getTime();

      const remainingMilliseconds =
        endDate.getTime() -
        now.getTime();

      totalDays = Math.max(
        0,
        Math.ceil(
          totalMilliseconds /
            (1000 * 60 * 60 * 24)
        )
      );

      usedDays = Math.min(
        totalDays,
        Math.max(
          0,
          Math.floor(
            usedMilliseconds /
              (1000 * 60 * 60 * 24)
          )
        )
      );

      remainingDays = Math.max(
        0,
        Math.ceil(
          remainingMilliseconds /
            (1000 * 60 * 60 * 24)
        )
      );
    }

    // ============================================
    // RETURN
    // ============================================

    return res.status(200).json({
      success: true,

      data: {
        hasActivePlan: true,

        currentPlanId:
          currentPlan._id,

        currentPlanName:
          currentPlan.planName,

        currentPlanPrice,

        currentPlanStartDate:
          user.subscriptionStartDate,

        currentPlanEndDate:
          user.subscriptionEndDate,

        usedDays,

        totalDays,

        remainingDays,

        // Current plan ki remaining value
        // abhi calculation ke liye available
        remainingValue: 0,

        newPlanName:
          newPlan.planName,

        newPlanPrice,

        additionalAmount,

        message:
          `Additional amount is Rs. ${additionalAmount}`,
      },

      message:
        "Subscription checked successfully.",
    });

  } catch (error: any) {
    console.error(
      "CHECK SUBSCRIPTION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Unable to check subscription.",
    });
  }
};

// ============================================================
// BALANCE PAYMENT REQUEST
// ============================================================

export const createBalanceRequest = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const { planId, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (paymentMethod !== "balance") {
      return res.status(400).json({
        success: false,
        message: "Payment method must be balance.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found.",
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: "This subscription plan is inactive.",
      });
    }

    // ======================================================
    // EXISTING PENDING REQUEST
    // ======================================================

    const existingRequest = await SubscriptionRequest.findOne({
      user: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending subscription request.",
      });
    }

    // ======================================================
    // CALCULATE SERVER SIDE
    // ======================================================

    const calculation = await calculateAmount(user, plan);

    const amount = Number(calculation.additionalAmount);

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription amount.",
      });
    }

    // ======================================================
    // CHECK BALANCE
    // ======================================================

    const balance = Number(user.balance || 0);

    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    // ======================================================
    // CREATE REQUEST
    // ======================================================

    const request = await SubscriptionRequest.create({
      user: userId,

      plan: plan._id,

      planName: plan.planName,

      currentPlan: calculation.currentPlanId || null,

      currentPlanName: calculation.currentPlanName || null,

      currentPlanPrice: calculation.currentPlanPrice || 0,

      newPlanPrice: calculation.newPlanPrice,

      amount,

      paymentMethod: "balance",

      status: "pending",

      purpose: "subscription",
    });

    return res.status(201).json({
      success: true,

      message:
        "Subscription request created successfully. Waiting for admin approval.",

      data: request,
    });
  } catch (error: any) {
    console.error("CREATE BALANCE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create request.",
    });
  }
};

// ============================================================
// PAY NOW REQUEST
// ============================================================

export const createPaymentRequest = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const {
      planId,
      methodId,
      amount,
      planName,
      transactionId,
      receipt,
      paymentMethod,
      paymentMethodName,
      paymentAccountNumber,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const plan = await Subscription.findById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found.",
      });
    }

    if (!plan.isActive) {
      return res.status(400).json({
        success: false,
        message: "This subscription plan is inactive.",
      });
    }

    const existingRequest = await SubscriptionRequest.findOne({
      user: userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending subscription request.",
      });
    }

    // ======================================================
    // SERVER SIDE AMOUNT
    // ======================================================

    const calculation = await calculateAmount(user, plan);

    const serverAmount = Number(calculation.additionalAmount);

    const frontendAmount = Number(amount || 0);

    if (Math.abs(serverAmount - frontendAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: "Payment amount does not match the subscription amount.",
      });
    }

    // ======================================================
    // PAYMENT PROOF
    // ======================================================

    if (!transactionId && !receipt) {
      return res.status(400).json({
        success: false,
        message: "Payment proof is required.",
      });
    }

    // ======================================================
    // CREATE
    // ======================================================

    const request = await SubscriptionRequest.create({
      user: userId,

      plan: plan._id,

      planName: plan.planName || planName || "",

      currentPlan: calculation.currentPlanId || null,

      currentPlanName: calculation.currentPlanName || null,

      currentPlanPrice: calculation.currentPlanPrice || 0,

      newPlanPrice: calculation.newPlanPrice,

      amount: serverAmount,

      paymentMethod: paymentMethod || "other",

      paymentMethodId: methodId || null,

      paymentMethodName: paymentMethodName || null,

      paymentAccountNumber: paymentAccountNumber || null,

      transactionId: transactionId || null,

      receipt: receipt || null,

      status: "pending",

      purpose: "subscription",
    });

    return res.status(201).json({
      success: true,

      message: "Payment submitted successfully. Waiting for admin approval.",

      data: request,
    });
  } catch (error: any) {
    console.error("CREATE PAYMENT REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to submit payment.",
    });
  }
};

// ============================================================
// USER REQUEST HISTORY
// ============================================================

export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const requests = await SubscriptionRequest.find({
      user: userId,
    })
      .populate(
        "plan",
        "planName amount dailyAds amountPerAd planTimeLimit planImage",
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("GET MY REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch requests.",
    });
  }
};

// ============================================================
// ADMIN - GET ALL REQUESTS
// ============================================================

export const getAllRequests = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || "pending");

    const filter: any = {
      purpose: "subscription",
    };

    if (["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const requests = await SubscriptionRequest.find(filter)
      .populate("user", "name cellNo balance role")
      .populate(
        "plan",
        "planName amount dailyAds amountPerAd planTimeLimit planImage",
      )
      .populate("currentPlan", "planName amount")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("GET ALL REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch subscription requests.",
    });
  }
};

// ============================================================
// ADMIN - GET SINGLE REQUEST
// ============================================================

export const getSingleRequest = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    const request = await SubscriptionRequest.findById(id)
      .populate("user", "name cellNo balance role")
      .populate("plan")
      .populate("currentPlan");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Subscription request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    console.error("GET SINGLE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch request.",
    });
  }
};

// ============================================================
// ADMIN - APPROVE
// ============================================================

export const approveRequest = async (req: Request, res: Response) => {
  try {
    const adminId = getAdminId(req);

    const { id } = req.params;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const request = await SubscriptionRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Subscription request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}.`,
      });
    }

    const user = await User.findById(request.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const plan = await Subscription.findById(request.plan);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found.",
      });
    }

    // ======================================================
    // BALANCE PAYMENT
    // ======================================================

    if (request.paymentMethod === "balance") {
      const balance = Number(user.balance || 0);

      const amount = Number(request.amount || 0);

      // Check balance AGAIN
      if (balance < amount) {
        return res.status(400).json({
          success: false,
          message: "User does not have enough balance anymore.",
        });
      }

      // Deduct ONLY ON APPROVAL
      user.balance = balance - amount;
    }

    // ======================================================
    // EXTERNAL PAYMENT
    // ======================================================
    //
    // Do NOT modify user.balance.
    //
    // ======================================================

    // ======================================================
    // ACTIVATE SUBSCRIPTION
    // ======================================================

    const startDate = new Date();

    const endDate = new Date(startDate);

    endDate.setDate(endDate.getDate() + Number(plan.planTimeLimit));

    user.subscription = plan._id;

    user.subscriptionStartDate = startDate;

    user.subscriptionEndDate = endDate;

    await user.save();

    // ======================================================
    // APPROVE REQUEST
    // ======================================================

    request.status = "approved";

    request.approvedBy = adminId;

    request.approvedAt = new Date();

    await request.save();

    return res.status(200).json({
      success: true,

      message: "Subscription request approved and plan activated.",

      data: request,
    });
  } catch (error: any) {
    console.error("APPROVE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to approve request.",
    });
  }
};

// ============================================================
// ADMIN - REJECT
// ============================================================

export const rejectRequest = async (req: Request, res: Response) => {
  try {
    const adminId = getAdminId(req);

    const { id } = req.params;

    const { reason } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const request = await SubscriptionRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Subscription request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}.`,
      });
    }

    request.status = "rejected";

    request.rejectedBy = adminId;

    request.rejectedAt = new Date();

    request.rejectionReason =
      reason || "Subscription request rejected by admin.";

    await request.save();

    // ======================================================
    // IMPORTANT:
    // Balance is NOT changed on reject.
    // ======================================================

    return res.status(200).json({
      success: true,

      message: "Subscription request rejected successfully.",

      data: request,
    });
  } catch (error: any) {
    console.error("REJECT REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to reject request.",
    });
  }
};
