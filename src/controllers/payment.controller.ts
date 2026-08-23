import { Request, Response } from "express";
import mongoose from "mongoose";

import PaymentRequest from "../models/paymentRequest.model";
import PaymentSetting from "../models/paymentSetting.model";
import Subscription from "../models/subscription.model";
import User from "../models/user.model";

import { AuthRequest } from "../middleware/authCheck.middleware";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import { SubscriptionRequest } from "../models/subscriptionRequest.model";

// ============================================================
// CREATE DEPOSIT
// ============================================================

export const createDeposit = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const {
      methodId,
      amount,
      transactionId,
      planId,
    } = req.body || {};

    const receipt = req.file;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!methodId) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
      });
    }

    if (
      !amount ||
      Number.isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid deposit amount is required.",
      });
    }

    const numericAmount = Number(amount);

    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    const paymentSetting =
      await PaymentSetting.findById(methodId);

    if (!paymentSetting) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found.",
      });
    }

    if (paymentSetting.isActive === false) {
      return res.status(400).json({
        success: false,
        message:
          "This payment method is currently inactive.",
      });
    }

    // ========================================================
    // MINIMUM AMOUNT
    // ========================================================

    if (
      paymentSetting.minAmount !== undefined &&
      paymentSetting.minAmount !== null &&
      numericAmount < paymentSetting.minAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${paymentSetting.minAmount}.`,
      });
    }

    // ========================================================
    // MAXIMUM AMOUNT
    // ========================================================

    if (
      paymentSetting.maxAmount !== undefined &&
      paymentSetting.maxAmount !== null &&
      numericAmount > paymentSetting.maxAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum deposit is ${paymentSetting.maxAmount}.`,
      });
    }

    // ========================================================
    // PLAN VALIDATION
    // ========================================================

    let selectedPlan: any = null;

    if (planId) {
      if (
        !mongoose.Types.ObjectId.isValid(
          String(planId),
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid plan ID.",
        });
      }

      selectedPlan =
        await Subscription.findById(planId);

      if (!selectedPlan) {
        return res.status(404).json({
          success: false,
          message: "Selected plan not found.",
        });
      }
    }

    // ========================================================
    // USDT DETECTION
    // ========================================================

    const isUSDT =
      paymentSetting.paymentName
        ?.toLowerCase()
        .includes("usdt") ||
      paymentSetting.paymentNetwork
        ?.toLowerCase()
        .includes("usdt");

    // ========================================================
    // USDT TRANSACTION ID
    // ========================================================

    if (isUSDT) {
      if (
        typeof transactionId !== "string" ||
        !transactionId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "TRC20 transaction ID is required.",
        });
      }
    }

    // ========================================================
    // PAKISTAN RECEIPT
    // ========================================================

    if (!isUSDT && !receipt) {
      return res.status(400).json({
        success: false,
        message:
          "Payment receipt is required.",
      });
    }

    // ========================================================
    // CLOUDINARY RECEIPT
    // ========================================================

    let screenshot: string | null = null;

    if (receipt) {
      const uploaded =
        await uploadToCloudinary(
          receipt,
          "deposit-receipts",
        );

      screenshot = uploaded.url;
    }

    // ========================================================
    // CREATE PAYMENT REQUEST
    // ========================================================

    const paymentRequest =
      await PaymentRequest.create({
        user: userId,

        method: paymentSetting._id,

        amount: numericAmount,

        currency:
          paymentSetting.paymentName
            ?.toLowerCase()
            .includes("usdt")
            ? "USDT"
            : "PKR",

        transactionId:
          isUSDT
            ? transactionId.trim()
            : "",

        screenshot,

        status: "pending",

        // IMPORTANT
        // Normal deposit = null
        // Plan payment = plan ID
        planId: selectedPlan
          ? selectedPlan._id
          : null,

        subscription: null,
      });

    return res.status(201).json({
      success: true,

      message: selectedPlan
        ? "Plan payment submitted successfully. Wait for admin approval."
        : "Deposit submitted successfully. Wait for admin approval.",

      data: paymentRequest,
    });
  } catch (error) {
    console.error(
      "Create Deposit Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create deposit.",
    });
  }
};

// ============================================================
// DEPOSIT HISTORY
// ============================================================

export const getDepositHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const deposits =
      await PaymentRequest.find({
        user: userId,
      })
        .populate(
          "method",
          "paymentName paymentImage paymentNetwork",
        )
        .populate(
          "planId",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const formattedDeposits =
      deposits.map((deposit: any) => ({
        _id: deposit._id,

        amount: deposit.amount,

        currency:
          deposit.currency || "PKR",

        status: deposit.status,

        method:
          deposit.method?.paymentName ||
          "Deposit",

        transactionId:
          deposit.transactionId || "",

        planId:
          deposit.planId || null,

        subscription:
          deposit.subscription || null,

        createdAt:
          deposit.createdAt,

        updatedAt:
          deposit.updatedAt,
      }));

    return res.status(200).json({
      success: true,

      message:
        "Deposit history fetched successfully.",

      data: formattedDeposits,
    });
  } catch (error) {
    console.error(
      "Get Deposit History Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch deposit history.",
    });
  }
};

// ============================================================
// PENDING DEPOSITS
// ============================================================

export const getPendingDeposits = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const deposits =
      await PaymentRequest.find({
        status: "pending",
      })
        .populate(
          "user",
          "name email balance recharge",
        )
        .populate(
          "method",
          "paymentName paymentImage paymentNetwork paymentDetails paymentQRCode",
        )
        .populate(
          "planId",
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: deposits,
    });
  } catch (error) {
    console.error(
      "Get Pending Deposits Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending deposits.",
    });
  }
};
// ============================================================
// APPROVE DEPOSIT / SUBSCRIPTION REQUEST
// ============================================================

export const approveDeposit = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = String(req.params.id);

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    // ========================================================
    // FIND PAYMENT REQUEST FIRST
    // ========================================================

    let paymentRequest: any = null;

    try {
      paymentRequest =
        await PaymentRequest.findById(id);
    } catch (error) {
      console.error(
        "PaymentRequest find error:",
        error,
      );
    }

    // ========================================================
    // FIND SUBSCRIPTION REQUEST IF PAYMENT NOT FOUND
    // ========================================================

    let subscriptionRequest: any = null;

    if (!paymentRequest) {
      try {
        subscriptionRequest =
          await SubscriptionRequest.findById(id);
      } catch (error) {
        console.error(
          "SubscriptionRequest find error:",
          error,
        );
      }
    }

    // ========================================================
    // NOTHING FOUND
    // ========================================================

    if (
      !paymentRequest &&
      !subscriptionRequest
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Deposit or subscription request not found.",
      });
    }

    // ========================================================
    // ========================================================
    // PAYMENT REQUEST
    // ========================================================
    // ========================================================

    if (paymentRequest) {
      // ======================================================
      // ONLY PENDING
      // ======================================================

      if (
        String(
          paymentRequest.status,
        ).toLowerCase() !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Deposit is already ${paymentRequest.status}.`,
        });
      }

      // ======================================================
      // GET USER
      // ======================================================

      const user =
        await User.findById(
          paymentRequest.user,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ======================================================
      // PLAN PAYMENT
      // ======================================================

      let activatedPlan: any = null;

      if (paymentRequest.planId) {
        // ====================================================
        // GET PLAN
        // ====================================================

        activatedPlan =
          await Subscription.findById(
            paymentRequest.planId,
          );

        if (!activatedPlan) {
          return res.status(404).json({
            success: false,
            message:
              "Plan linked with this deposit was not found.",
          });
        }

        // ====================================================
        // USER SUBSCRIPTION
        // ====================================================
        // IMPORTANT:
        // Subscription.isActive = admin plan availability.
        // User subscription is stored in User.subscription.
        // ====================================================

        user.subscription =
          activatedPlan._id;

        // ====================================================
        // OPTIONAL: IF USER MODEL HAS START/END FIELDS
        // ====================================================

        const now = new Date();

        // Agar User model mein subscriptionStartDate hai
        if (
          Object.prototype.hasOwnProperty.call(
            user.toObject(),
            "subscriptionStartDate",
          )
        ) {
          (user as any).subscriptionStartDate =
            now;
        }

        // Agar User model mein subscriptionEndDate hai
        if (
          Object.prototype.hasOwnProperty.call(
            user.toObject(),
            "subscriptionEndDate",
          )
        ) {
          const endDate =
            new Date(now);

          const days =
            Number(
              activatedPlan.planTimeLimit || 0,
            );

          if (days > 0) {
            endDate.setDate(
              endDate.getDate() + days,
            );
          }

          (user as any).subscriptionEndDate =
            endDate;
        }

        // ====================================================
        // LINK PAYMENT REQUEST
        // ====================================================

        paymentRequest.subscription =
          activatedPlan._id;
      }

      // ======================================================
      // ADD BALANCE
      // ======================================================

      const depositAmount =
        Number(
          paymentRequest.amount || 0,
        );

      user.balance =
        Number(user.balance || 0) +
        depositAmount;

      // ======================================================
      // LAST RECHARGE
      // ======================================================

      user.recharge =
        depositAmount;

      // ======================================================
      // SAVE USER
      // ======================================================

      await user.save();

      // ======================================================
      // APPROVE PAYMENT
      // ======================================================

      paymentRequest.status =
        "approved";

      await paymentRequest.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          paymentRequest.planId
            ? "Deposit approved, balance added and subscription activated successfully."
            : "Deposit approved and balance added successfully.",

        data: {
          deposit:
            paymentRequest,

          balance:
            user.balance,

          planActivated:
            Boolean(
              paymentRequest.planId,
            ),

          plan:
            activatedPlan,
        },
      });
    }

    // ========================================================
    // ========================================================
    // SUBSCRIPTION REQUEST
    // ========================================================
    // ========================================================

    if (subscriptionRequest) {
      // ======================================================
      // ONLY PENDING
      // ======================================================

      if (
        String(
          subscriptionRequest.status,
        ).toLowerCase() !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Subscription request is already ${subscriptionRequest.status}.`,
        });
      }

      // ======================================================
      // GET USER
      // ======================================================

      const user =
        await User.findById(
          subscriptionRequest.user,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ======================================================
      // GET PLAN
      // ======================================================

      const planId =
        subscriptionRequest.plan?._id ||
        subscriptionRequest.plan;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message:
            "No subscription plan linked with this request.",
        });
      }

      const plan =
        await Subscription.findById(
          planId,
        );

      if (!plan) {
        return res.status(404).json({
          success: false,
          message:
            "Subscription plan not found.",
        });
      }

      // ======================================================
      // PLAN MUST BE ACTIVE
      // ======================================================

      if (!plan.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "This subscription plan is currently inactive.",
        });
      }

      // ======================================================
      // ACTIVATE USER SUBSCRIPTION
      // ======================================================

      user.subscription =
        plan._id;

      // ======================================================
      // OPTIONAL USER SUBSCRIPTION DATES
      // ======================================================

      const startDate =
        new Date();

      if (
        Object.prototype.hasOwnProperty.call(
          user.toObject(),
          "subscriptionStartDate",
        )
      ) {
        (user as any).subscriptionStartDate =
          startDate;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          user.toObject(),
          "subscriptionEndDate",
        )
      ) {
        const endDate =
          new Date(startDate);

        const days =
          Number(
            plan.planTimeLimit || 0,
          );

        if (days > 0) {
          endDate.setDate(
            endDate.getDate() + days,
          );
        }

        (user as any).subscriptionEndDate =
          endDate;
      }

      // ======================================================
      // SAVE USER
      // ======================================================

      await user.save();

      // ======================================================
      // APPROVE SUBSCRIPTION REQUEST
      // ======================================================

      subscriptionRequest.status =
        "approved";

      // Agar model mein approvedAt field hai
      if (
        Object.prototype.hasOwnProperty.call(
          subscriptionRequest.toObject(),
          "approvedAt",
        )
      ) {
        subscriptionRequest.approvedAt =
          new Date();
      }

      await subscriptionRequest.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          "Subscription request approved and user subscription activated successfully.",

        data: {
          request:
            subscriptionRequest,

          userId:
            user._id,

          subscription:
            plan,

          subscriptionActivated:
            true,
        },
      });
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    return res.status(404).json({
      success: false,
      message:
        "Request not found.",
    });
  } catch (error: any) {
    console.error(
      "Approve Deposit/Subscription Error:",
      error,
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message,
    );

    console.error(
      "ERROR STACK:",
      error?.stack,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve request.",
    });
  }
};


// ============================================================
// REJECT DEPOSIT / SUBSCRIPTION REQUEST
// ============================================================

export const rejectDeposit = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id = String(req.params.id);

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    // ========================================================
    // FIND PAYMENT REQUEST
    // ========================================================

    let paymentRequest: any = null;

    try {
      paymentRequest =
        await PaymentRequest.findById(id);
    } catch (error) {
      console.error(
        "PaymentRequest find error:",
        error,
      );
    }

    // ========================================================
    // FIND SUBSCRIPTION REQUEST
    // ========================================================

    let subscriptionRequest: any = null;

    if (!paymentRequest) {
      try {
        subscriptionRequest =
          await SubscriptionRequest.findById(id);
      } catch (error) {
        console.error(
          "SubscriptionRequest find error:",
          error,
        );
      }
    }

    // ========================================================
    // NOTHING FOUND
    // ========================================================

    if (
      !paymentRequest &&
      !subscriptionRequest
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Deposit or subscription request not found.",
      });
    }

    // ========================================================
    // PAYMENT REQUEST
    // ========================================================

    if (paymentRequest) {
      // ======================================================
      // ONLY PENDING
      // ======================================================

      if (
        String(
          paymentRequest.status,
        ).toLowerCase() !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Deposit is already ${paymentRequest.status}.`,
        });
      }

      // ======================================================
      // REJECT
      // ======================================================

      paymentRequest.status =
        "rejected";

      await paymentRequest.save();

      return res.status(200).json({
        success: true,

        message:
          "Deposit rejected successfully.",
      });
    }

    // ========================================================
    // SUBSCRIPTION REQUEST
    // ========================================================

    if (subscriptionRequest) {
      // ======================================================
      // ONLY PENDING
      // ======================================================

      if (
        String(
          subscriptionRequest.status,
        ).toLowerCase() !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Subscription request is already ${subscriptionRequest.status}.`,
        });
      }

      // ======================================================
      // REJECT
      // ======================================================

      subscriptionRequest.status =
        "rejected";

      // Agar model mein rejectedAt field hai
      if (
        Object.prototype.hasOwnProperty.call(
          subscriptionRequest.toObject(),
          "rejectedAt",
        )
      ) {
        subscriptionRequest.rejectedAt =
          new Date();
      }

      await subscriptionRequest.save();

      return res.status(200).json({
        success: true,

        message:
          "Subscription request rejected successfully.",
      });
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    return res.status(404).json({
      success: false,
      message:
        "Request not found.",
    });
  } catch (error: any) {
    console.error(
      "Reject Deposit/Subscription Error:",
      error,
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message,
    );

    console.error(
      "ERROR STACK:",
      error?.stack,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject request.",
    });
  }
};

// ============================================================
// GET PAYMENT SETTINGS
// ============================================================

export const getPaymentSettings = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const paymentSettings =
      await PaymentSetting.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,

      message:
        "Payment settings fetched successfully.",

      data: paymentSettings,
    });
  } catch (error) {
    console.error(
      "Get Payment Settings Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching payment settings.",
    });
  }
};

// ============================================================
// FILE TYPES
// ============================================================

interface PaymentFiles {
  paymentImage?: Express.Multer.File[];
  paymentQRCode?: Express.Multer.File[];
}

// ============================================================
// CREATE PAYMENT SETTING
// ============================================================

export const createPaymentSetting = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const body =
      req.body || {};

    const {
      paymentName,
      paymentDetails,
      paymentNetwork,
      isActive,
      minAmount,
      maxAmount,
    } = body;

    const files =
      (req.files as PaymentFiles | undefined) ||
      {};

    const image =
      files.paymentImage?.[0];

    const qrCode =
      files.paymentQRCode?.[0];

    // ========================================================
    // PAYMENT NAME
    // ========================================================

    if (
      typeof paymentName !==
        "string" ||
      !paymentName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment name is required.",
      });
    }

    const cleanName =
      paymentName.trim();

    // ========================================================
    // PAYMENT DETAILS
    // ========================================================

    if (
      typeof paymentDetails !==
        "string" ||
      !paymentDetails.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment details are required.",
      });
    }

    const cleanDetails =
      paymentDetails.trim();

    // ========================================================
    // NETWORK
    // ========================================================

    const cleanNetwork =
      typeof paymentNetwork ===
        "string" &&
      paymentNetwork.trim()
        ? paymentNetwork.trim()
        : null;

    // ========================================================
    // MINIMUM
    // ========================================================

    let parsedMinAmount = 1;

    if (
      minAmount !==
        undefined &&
      minAmount !== null &&
      minAmount !== ""
    ) {
      parsedMinAmount =
        Number(minAmount);
    }

    if (
      !Number.isFinite(
        parsedMinAmount,
      ) ||
      parsedMinAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid minimum amount.",
      });
    }

    // ========================================================
    // MAXIMUM
    // ========================================================

    let parsedMaxAmount:
      | number
      | null = null;

    if (
      maxAmount !==
        undefined &&
      maxAmount !== null &&
      maxAmount !== ""
    ) {
      parsedMaxAmount =
        Number(maxAmount);
    }

    if (
      parsedMaxAmount !== null &&
      (!Number.isFinite(
        parsedMaxAmount,
      ) ||
        parsedMaxAmount < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid maximum amount.",
      });
    }

    // ========================================================
    // MIN / MAX
    // ========================================================

    if (
      parsedMaxAmount !== null &&
      parsedMaxAmount <
        parsedMinAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum amount cannot be less than minimum amount.",
      });
    }

    // ========================================================
    // ACTIVE
    // ========================================================

    let active = true;

    if (
      isActive !== undefined
    ) {
      if (
        typeof isActive ===
        "boolean"
      ) {
        active =
          isActive;
      } else if (
        typeof isActive ===
        "string"
      ) {
        active =
          isActive.toLowerCase() ===
          "true";
      } else {
        active =
          Boolean(isActive);
      }
    }

    // ========================================================
    // DUPLICATE
    // ========================================================

    const existing =
      await PaymentSetting.findOne({
        paymentName:
          cleanName,

        paymentDetails:
          cleanDetails,
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "This payment method and payment details already exist.",
      });
    }

    // ========================================================
    // CLOUDINARY
    // ========================================================

    let paymentImage:
      | string
      | null = null;

    let paymentQRCode:
      | string
      | null = null;

    if (image) {
      const uploaded =
        await uploadToCloudinary(
          image,
          "payments",
        );

      paymentImage =
        uploaded.url;
    }

    if (qrCode) {
      const uploadedQR =
        await uploadToCloudinary(
          qrCode,
          "payments/qrcodes",
        );

      paymentQRCode =
        uploadedQR.url;
    }

    // ========================================================
    // CREATE
    // ========================================================

    const paymentSetting =
      await PaymentSetting.create({
        paymentName:
          cleanName,

        paymentDetails:
          cleanDetails,

        paymentNetwork:
          cleanNetwork,

        paymentImage,

        paymentQRCode,

        isActive:
          active,

        minAmount:
          parsedMinAmount,

        maxAmount:
          parsedMaxAmount,
      });

    return res.status(201).json({
      success: true,

      message:
        "Payment method added successfully.",

      data:
        paymentSetting,
    });
  } catch (error) {
    console.error(
      "Create Payment Setting Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create payment setting.",
    });
  }
};

// ============================================================
// UPDATE PAYMENT SETTING
// ============================================================

export const updatePaymentSetting = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id =
      String(req.params.id);

    // ========================================================
    // ID
    // ========================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment setting ID.",
      });
    }

    const body =
      req.body || {};

    const {
      paymentName,
      paymentDetails,
      paymentNetwork,
      isActive,
      minAmount,
      maxAmount,
    } = body;

    const files =
      (req.files as PaymentFiles | undefined) ||
      {};

    const image =
      files.paymentImage?.[0];

    const qrCode =
      files.paymentQRCode?.[0];

    // ========================================================
    // FIND
    // ========================================================

    const setting =
      await PaymentSetting.findById(
        id,
      );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message:
          "Payment setting not found.",
      });
    }

    // ========================================================
    // NAME
    // ========================================================

    if (
      typeof paymentName !==
        "string" ||
      !paymentName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment name is required.",
      });
    }

    const cleanName =
      paymentName.trim();

    // ========================================================
    // DETAILS
    // ========================================================

    if (
      typeof paymentDetails !==
        "string" ||
      !paymentDetails.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment details are required.",
      });
    }

    const cleanDetails =
      paymentDetails.trim();

    // ========================================================
    // NETWORK
    // ========================================================

    const cleanNetwork =
      typeof paymentNetwork ===
        "string" &&
      paymentNetwork.trim()
        ? paymentNetwork.trim()
        : null;

    // ========================================================
    // MINIMUM
    // ========================================================

    let parsedMinAmount = 1;

    if (
      minAmount !==
        undefined &&
      minAmount !== null &&
      minAmount !== ""
    ) {
      parsedMinAmount =
        Number(minAmount);
    }

    if (
      !Number.isFinite(
        parsedMinAmount,
      ) ||
      parsedMinAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid minimum amount.",
      });
    }

    // ========================================================
    // MAXIMUM
    // ========================================================

    let parsedMaxAmount:
      | number
      | null = null;

    if (
      maxAmount !==
        undefined &&
      maxAmount !== null &&
      maxAmount !== ""
    ) {
      parsedMaxAmount =
        Number(maxAmount);
    }

    if (
      parsedMaxAmount !== null &&
      (!Number.isFinite(
        parsedMaxAmount,
      ) ||
        parsedMaxAmount < 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid maximum amount.",
      });
    }

    // ========================================================
    // MIN / MAX
    // ========================================================

    if (
      parsedMaxAmount !== null &&
      parsedMaxAmount <
        parsedMinAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum amount cannot be less than minimum amount.",
      });
    }

    // ========================================================
    // DUPLICATE
    // ========================================================

    const duplicate =
      await PaymentSetting.findOne({
        _id: {
          $ne: id,
        },

        paymentName:
          cleanName,

        paymentDetails:
          cleanDetails,
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "This payment method and payment details already exist.",
      });
    }

    // ========================================================
    // EXISTING IMAGES
    // ========================================================

    let paymentImage =
      setting.paymentImage ??
      null;

    let paymentQRCode =
      setting.paymentQRCode ??
      null;

    // ========================================================
    // NEW IMAGE
    // ========================================================

    if (image) {
      const uploaded =
        await uploadToCloudinary(
          image,
          "payments",
        );

      paymentImage =
        uploaded.url;
    }

    // ========================================================
    // NEW QR
    // ========================================================

    if (qrCode) {
      const uploadedQR =
        await uploadToCloudinary(
          qrCode,
          "payments/qrcodes",
        );

      paymentQRCode =
        uploadedQR.url;
    }

    // ========================================================
    // ACTIVE
    // ========================================================

    let active =
      setting.isActive;

    if (
      isActive !== undefined
    ) {
      if (
        typeof isActive ===
        "boolean"
      ) {
        active =
          isActive;
      } else if (
        typeof isActive ===
        "string"
      ) {
        active =
          isActive.toLowerCase() ===
          "true";
      } else {
        active =
          Boolean(isActive);
      }
    }

    // ========================================================
    // UPDATE
    // ========================================================

    setting.paymentName =
      cleanName;

    setting.paymentDetails =
      cleanDetails;

    setting.paymentNetwork =
      cleanNetwork;

    setting.paymentImage =
      paymentImage;

    setting.paymentQRCode =
      paymentQRCode;

    setting.isActive =
      active;

    setting.minAmount =
      parsedMinAmount;

    setting.maxAmount =
      parsedMaxAmount;

    await setting.save();

    return res.status(200).json({
      success: true,

      message:
        "Payment setting updated successfully.",

      data:
        setting,
    });
  } catch (error) {
    console.error(
      "Update Payment Setting Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update payment setting.",
    });
  }
};

// ============================================================
// DELETE PAYMENT SETTING
// ============================================================

export const deletePaymentSetting = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const id =
      String(req.params.id);

    if (
      !mongoose.Types.ObjectId.isValid(
        id,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment setting ID.",
      });
    }

    const setting =
      await PaymentSetting.findById(
        id,
      );

    if (!setting) {
      return res.status(404).json({
        success: false,
        message:
          "Payment setting not found.",
      });
    }

    await PaymentSetting.findByIdAndDelete(
      id,
    );

    return res.status(200).json({
      success: true,

      message:
        "Payment method deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Payment Setting Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete payment setting.",
    });
  }
};

// ============================================================
// PAYMENT REQUEST STATUS
// ============================================================

export const getPaymentRequestStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const {
      subscriptionId,
    } = req.params;

    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription ID is required.",
      });
    }

    const paymentRequest =
      await PaymentRequest.findOne({
        user: userId,

        subscription:
          subscriptionId,
      })
        .sort({
          createdAt: -1,
        });

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        message:
          "No payment request found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Payment request status fetched successfully.",

      data: {
        status:
          paymentRequest.status,

        transactionId:
          paymentRequest.transactionId,

        screenshot:
          paymentRequest.screenshot,

        planId:
          paymentRequest.planId,

        subscription:
          paymentRequest.subscription,

        createdAt:
          paymentRequest.createdAt,

        updatedAt:
          paymentRequest.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get Payment Request Status Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch payment request status.",
    });
  }
};

// ============================================================
// GET ALL DEPOSIT REQUESTS - ADMIN
// ============================================================

// ============================================================
// GET ALL DEPOSIT + SUBSCRIPTION PAYMENT REQUESTS - ADMIN
// ============================================================

// ============================================================
// GET ALL DEPOSIT + SUBSCRIPTION REQUESTS - ADMIN
// ============================================================

export const getAdminDepositRequests = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // ========================================================
    // 1. NORMAL DEPOSIT REQUESTS
    // ========================================================

    const deposits =
      await PaymentRequest.find({})
        .populate(
          "user",
          "name email cellNo balance recharge role",
        )
        .populate(
          "method",
          "paymentName paymentImage paymentNetwork paymentDetails paymentQRCode",
        )
        .populate(
          "planId",
          "planName amount dailyAds amountPerAd planTimeLimit planImage",
        )
        .populate(
          "subscription",
          "planName amount dailyAds amountPerAd planTimeLimit planImage isActive",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // ========================================================
    // FORMAT NORMAL DEPOSITS
    // ========================================================

    const formattedDeposits =
      deposits.map(
        (
          deposit: any,
          index: number,
        ) => {
          const depositNumber =
            `DEP-${String(
              index + 1,
            ).padStart(
              6,
              "0",
            )}`;

          // ==================================================
          // TRANSACTION
          // ==================================================

          const transactionId =
            deposit.transactionId ||
            deposit.transaction ||
            "";

          const transactionDisplay =
            transactionId &&
            String(
              transactionId,
            ).trim()
              ? String(
                  transactionId,
                ).trim()
              : depositNumber;

          // ==================================================
          // PAYMENT METHOD
          // ==================================================

          const paymentMethod =
            deposit.method || null;

          // ==================================================
          // GATEWAY
          // ==================================================

          const gateway =
            paymentMethod?.paymentName ||
            paymentMethod?.name ||
            deposit.gateway ||
            "—";

          // ==================================================
          // PLAN
          // ==================================================

          const plan =
            deposit.planId ||
            deposit.subscription ||
            null;

          // ==================================================
          // RETURN
          // ==================================================

          return {
            ...deposit,

            // ==================================================
            // TYPE
            // ==================================================

            type: deposit.planId
              ? "plan"
              : "deposit",

            isPlanPayment:
              Boolean(
                deposit.planId,
              ),

            isNormalDeposit:
              !deposit.planId,

            // ==================================================
            // DEPOSIT NUMBER
            // ==================================================

            depositNumber,

            transactionDisplay,

            // ==================================================
            // TRANSACTION ID
            // ==================================================

            transactionId:
              transactionId || null,

            // ==================================================
            // PAYMENT METHOD
            // ==================================================

            paymentMethod,

            method:
              paymentMethod,

            // ==================================================
            // GATEWAY
            // ==================================================

            gateway,

            // ==================================================
            // PLAN
            // ==================================================

            plan,

            planId:
              deposit.planId ||
              null,

            // ==================================================
            // SUBSCRIPTION
            // ==================================================

            subscription:
              deposit.subscription ||
              null,
          };
        },
      );

    // ========================================================
    // 2. SUBSCRIPTION REQUESTS
    // ========================================================

    const subscriptionRequests =
      await SubscriptionRequest.find({
        purpose: "subscription",
      })
        .populate(
          "user",
          "name email cellNo balance recharge role",
        )
        .populate(
          "plan",
          "planName amount dailyAds amountPerAd planTimeLimit planImage",
        )
        .populate(
          "currentPlan",
          "planName amount",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // ========================================================
    // FORMAT SUBSCRIPTION REQUESTS
    // ========================================================

    const formattedSubscriptions =
      subscriptionRequests.map(
        (
          request: any,
          index: number,
        ) => {
          const requestNumber =
            `SUB-${String(
              index + 1,
            ).padStart(
              6,
              "0",
            )}`;

          // ==================================================
          // TRANSACTION
          // ==================================================

          const transactionId =
            request.transactionId ||
            request.transaction ||
            request.txHash ||
            "";

          const transactionDisplay =
            transactionId &&
            String(
              transactionId,
            ).trim()
              ? String(
                  transactionId,
                ).trim()
              : requestNumber;

          // ==================================================
          // PAYMENT METHOD
          // ==================================================

          const paymentMethod =
            request.paymentMethod ||
            request.method ||
            null;

          // ==================================================
          // GATEWAY
          // ==================================================

          const gateway =
            paymentMethod?.paymentName ||
            paymentMethod?.name ||
            request.gateway ||
            "—";

          // ==================================================
          // PLAN
          // ==================================================

          const plan =
            request.plan || null;

          // ==================================================
          // RETURN
          // ==================================================

          return {
            ...request,

            // ==================================================
            // TYPE
            // ==================================================

            type: "plan",

            isPlanPayment: true,

            isNormalDeposit: false,

            // ==================================================
            // NUMBER
            // ==================================================

            depositNumber:
              requestNumber,

            transactionDisplay,

            transactionId:
              transactionId || null,

            // ==================================================
            // PAYMENT METHOD
            // ==================================================

            paymentMethod,

            method:
              paymentMethod,
            // ==================================================
            // PLAN
            // ==================================================

            plan,

            planId:
              request.plan ||
              null,

            // ==================================================
            // SUBSCRIPTION REQUEST ID
            // ==================================================

            subscriptionRequestId:
              request._id,

            // ==================================================
            // CURRENT PLAN
            // ==================================================

            previousPlan:
              request.currentPlan ||
              null,
          };
        },
      );

    // ========================================================
    // 3. MERGE BOTH
    // ========================================================

    const all = [
      ...formattedDeposits,
      ...formattedSubscriptions,
    ].sort(
      (
        a: any,
        b: any,
      ) =>
        new Date(
          b.createdAt,
        ).getTime() -
        new Date(
          a.createdAt,
        ).getTime(),
    );

    // ========================================================
    // 4. PENDING
    // ========================================================

    const pending =
      all.filter(
        (item: any) =>
          String(
            item.status || "",
          ).toLowerCase() ===
          "pending",
      );

    // ========================================================
    // 5. APPROVED
    // ========================================================

    const approved =
      all.filter(
        (item: any) =>
          String(
            item.status || "",
          ).toLowerCase() ===
          "approved",
      );

    // ========================================================
    // 6. REJECTED
    // ========================================================

    const rejected =
      all.filter(
        (item: any) =>
          String(
            item.status || "",
          ).toLowerCase() ===
          "rejected",
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Deposit and subscription requests fetched successfully.",

      data: {
        all,

        pending,

        approved,

        rejected,

        counts: {
          all: all.length,

          pending:
            pending.length,

          approved:
            approved.length,

          rejected:
            rejected.length,
        },
      },
    });
  } catch (error: any) {
    console.error(
      "GET ADMIN DEPOSIT REQUESTS ERROR:",
      error,
    );

    console.error(
      "ERROR MESSAGE:",
      error?.message,
    );

    console.error(
      "ERROR STACK:",
      error?.stack,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to get deposit and subscription requests.",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error?.message
          : undefined,
    });
  }
};
// ============================================================
// UPDATE DEPOSIT STATUS - ADMIN
// ============================================================

export const updateDepositStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const id = String(req.params.id);

    const { status } = req.body || {};

    // ========================================================
    // VALIDATE ID
    // ========================================================

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    // ========================================================
    // VALIDATE STATUS
    // ========================================================

    const newStatus = String(
      status || "",
    ).toLowerCase();

    if (
      !["approved", "rejected"].includes(
        newStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be approved or rejected.",
      });
    }

    // ========================================================
    // FIRST: PAYMENT REQUEST
    // ========================================================

    const paymentRequest =
      await PaymentRequest.findById(id);

    // ========================================================
    // PAYMENT REQUEST EXISTS
    // ========================================================

    if (paymentRequest) {
      // ------------------------------------------------------
      // ONLY PENDING
      // ------------------------------------------------------

      if (
        String(
          paymentRequest.status,
        ).toLowerCase() !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Request is already ${paymentRequest.status}.`,
        });
      }

      // ======================================================
      // REJECT PAYMENT REQUEST
      // ======================================================

      if (newStatus === "rejected") {
        paymentRequest.status =
          "rejected";

        await paymentRequest.save();

        return res.status(200).json({
          success: true,

          message:
            "Deposit rejected successfully.",

          data: {
            requestType: "deposit",

            deposit:
              paymentRequest,
          },
        });
      }

      // ======================================================
      // GET USER
      // ======================================================

      const user =
        await User.findById(
          paymentRequest.user,
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ======================================================
      // PLAN PAYMENT
      // ======================================================

      let activatedPlan:
        | any = null;

      if (paymentRequest.planId) {
        activatedPlan =
          await Subscription.findById(
            paymentRequest.planId,
          );

        if (!activatedPlan) {
          return res.status(404).json({
            success: false,
            message:
              "Plan linked with this request was not found.",
          });
        }

        // ----------------------------------------------------
        // ACTIVATE PLAN
        // ----------------------------------------------------

        activatedPlan.isActive =
          true;
        
        await activatedPlan.save();

        // ----------------------------------------------------
        // LINK PAYMENT REQUEST
        // ----------------------------------------------------

        paymentRequest.subscription =
          activatedPlan._id;

        // ----------------------------------------------------
        // LINK USER
        // ----------------------------------------------------

        user.subscription =
          activatedPlan._id;
      }

      // ======================================================
      // ADD BALANCE
      // ======================================================

      const depositAmount =
        Number(
          paymentRequest.amount || 0,
        );

      user.balance =
        Number(
          user.balance || 0,
        ) +
        depositAmount;

      user.recharge =
        depositAmount;
     if(paymentRequest.planId){
      user.lockedSubscriptionAmount = depositAmount
     }   
    
      await user.save();

      // ======================================================
      // APPROVE PAYMENT REQUEST
      // ======================================================

      paymentRequest.status =
        "approved";

      await paymentRequest.save();

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          paymentRequest.planId
            ? "Deposit approved, balance added and subscription activated successfully."
            : "Deposit approved and balance added successfully.",

        data: {
          requestType:
            "deposit",

          deposit:
            paymentRequest,

          balance:
            user.balance,

          planActivated:
            Boolean(
              paymentRequest.planId,
            ),

          plan:
            activatedPlan,
        },
      });
    }

    // ========================================================
    // SECOND: SUBSCRIPTION REQUEST
    // ========================================================

    const subscriptionRequest =
      await SubscriptionRequest.findById(id);

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (!subscriptionRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Deposit or subscription request not found.",
      });
    }

    // ========================================================
    // ONLY PENDING
    // ========================================================

    if (
      String(
        subscriptionRequest.status,
      ).toLowerCase() !==
      "pending"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Request is already ${subscriptionRequest.status}.`,
      });
    }

    // ========================================================
    // REJECT SUBSCRIPTION REQUEST
    // ========================================================

    if (newStatus === "rejected") {
      subscriptionRequest.status =
        "rejected";

      subscriptionRequest.rejectedAt =
        new Date();

      await subscriptionRequest.save();

      return res.status(200).json({
        success: true,

        message:
          "Subscription request rejected successfully.",

        data: {
          requestType:
            "subscription",

          request:
            subscriptionRequest,
        },
      });
    }

    // ========================================================
    // GET USER
    // ========================================================

    const user =
      await User.findById(
        subscriptionRequest.user,
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ========================================================
    // GET NEW PLAN
    // ========================================================

    const planId =
      subscriptionRequest.plan;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message:
          "No subscription plan is linked with this request.",
      });
    }

    const activatedPlan =
      await Subscription.findById(
        planId,
      );

    if (!activatedPlan) {
      return res.status(404).json({
        success: false,
        message:
          "Subscription plan not found.",
      });
    }

    // ========================================================
    // ACTIVATE SUBSCRIPTION PLAN
    // ========================================================

    activatedPlan.isActive =
      true;

    await activatedPlan.save();

    // ========================================================
    // ACTIVATE USER SUBSCRIPTION
    // ========================================================

    user.subscription =
      activatedPlan._id;
    user.lockedSubscriptionAmount = subscriptionRequest.currentPlanPrice
    await user.save();

    // ========================================================
    // ⭐ UPDATE SUBSCRIPTION REQUEST
    // ========================================================

    subscriptionRequest.hasActivePlan =
      true;

    subscriptionRequest.currentPlan =
      activatedPlan._id;

    subscriptionRequest.currentPlanName =
      activatedPlan.planName;

    subscriptionRequest.currentPlanPrice =
      Number(
        activatedPlan.amount || 0,
      );

    // ========================================================
    // APPROVE
    // ========================================================

    subscriptionRequest.status =
      "approved";

    subscriptionRequest.approvedAt =
      new Date();

    // If admin ID exists in auth middleware
  if (req.user?.id) {
  subscriptionRequest.approvedBy =
    new mongoose.Types.ObjectId(req.user.id);
}
    await subscriptionRequest.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Subscription request approved and subscription activated successfully.",

      data: {
        requestType:
          "subscription",

        request:
          subscriptionRequest,

        user: {
          _id: user._id,

          subscription:
            user.subscription,
        },

        plan:
          activatedPlan,

        planActivated:
          true,

        subscriptionInfo: {
          hasActivePlan:
            true,

          currentPlan:
            activatedPlan._id,

          currentPlanName:
            activatedPlan.planName,

          currentPlanPrice:
            Number(
              activatedPlan.amount || 0,
            ),
        },
      },
    });
  } catch (error) {
    console.error(
      "updateDepositStatus error:",
      error,
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to update request status.",
    });
  }
};