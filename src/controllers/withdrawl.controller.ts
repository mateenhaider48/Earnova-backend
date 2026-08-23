import { Request, Response } from "express";
import mongoose from "mongoose";

import Withdrawal from "../models/withdrawl.model";
import WithdrawalAccount from "../models/withdrawlAccount.model";
import PaymentSetting from "../models/paymentSetting.model";
import User from "../models/user.model";
import { AuthRequest } from "../middleware/authCheck.middleware";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import withdrawlModel from "../models/withdrawl.model";
import WithdrawalMethod from "../models/withdrawalMethod.model";

/*
============================================================
GET SAVED WITHDRAWAL ACCOUNT
============================================================
*/

export const getWithdrawalAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const methodId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method.",
      });
    }

    const account = await WithdrawalAccount.findOne({
      user: userId,
      methodId,
    }).lean();

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        account,
      },
    });
  } catch (error) {
    console.error("getWithdrawalAccount error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get withdrawal account.",
    });
  }
};

/*
============================================================
SAVE / UPDATE WITHDRAWAL ACCOUNT
============================================================
*/

export const saveWithdrawalAccount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { methodId, methodName, accountNumber, walletAddress, accountName } =
      req.body || {};

    if (!methodId) {
      return res.status(400).json({
        success: false,
        message: "methodId is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method.",
      });
    }

    /*
    --------------------------------------------------------
    GET METHOD
    --------------------------------------------------------
    */

    const method = await WithdrawalMethod.findById(methodId).lean();

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal method not found.",
      });
    }

    /*
    --------------------------------------------------------
    DETERMINE METHOD TYPE
    --------------------------------------------------------
    */

    const methodType = String((method as any).type || "").toLowerCase();

    const isUsdt = methodType === "usdt";

    /*
    --------------------------------------------------------
    VALIDATE ACCOUNT
    --------------------------------------------------------
    */

    if (isUsdt) {
      if (!walletAddress || !String(walletAddress).trim()) {
        return res.status(400).json({
          success: false,
          message: "Please enter your USDT wallet address.",
        });
      }
    } else {
      if (!accountNumber || !String(accountNumber).trim()) {
        return res.status(400).json({
          success: false,
          message: "Please enter account number.",
        });
      }

      if (!accountName || !String(accountName).trim()) {
        return res.status(400).json({
          success: false,
          message: "Please enter account holder name.",
        });
      }
    }

    /*
    --------------------------------------------------------
    SAVE / UPDATE
    --------------------------------------------------------
    */

    const account = await WithdrawalAccount.findOneAndUpdate(
      {
        user: userId,
        methodId,
      },
      {
        $set: {
          user: userId,
          methodId,
          methodName: String((method as any).name || methodName || "").trim(),

          accountNumber: isUsdt ? undefined : String(accountNumber).trim(),

          walletAddress: isUsdt ? String(walletAddress).trim() : undefined,

          accountName: isUsdt ? undefined : String(accountName).trim(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Withdrawal account saved successfully.",
      data: {
        account,
      },
    });
  } catch (error) {
    console.error("saveWithdrawalAccount error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save withdrawal account.",
    });
  }
};

export const getWithdrawalMethods = async (req: Request, res: Response) => {
  try {
    const withdrawalMethods = await WithdrawalMethod.find();
    return res.status(200).json({
      success: true,
      message: "Withdrawal methods fetched successfully.",
      data: withdrawalMethods,
    });
  } catch (error) {
    console.error("Get Withdrawal Methods Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch withdrawal methods.",
    });
  }
};

export const createWithdrawalMethod = async (req: Request, res: Response) => {
  try {
    const { paymentName } = req.body;

    if (!paymentName || !paymentName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Payment name is required.",
      });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const paymentImageFile = files?.paymentImage?.[0];

    if (!paymentImageFile) {
      return res.status(400).json({
        success: false,
        message: "Payment image is required.",
      });
    }

    // ========================================================
    // UPLOAD IMAGE TO CLOUDINARY
    // ========================================================

    const image = await uploadToCloudinary(paymentImageFile);

    // ========================================================
    // CREATE WITHDRAWAL METHOD
    // ========================================================

    const withdrawalMethod = await WithdrawalMethod.create({
      paymentName: paymentName.trim(),
      paymentImage: image.url,
    });

    return res.status(201).json({
      success: true,
      message: "Withdrawal method created successfully.",
      data: withdrawalMethod,
    });
  } catch (error) {
    console.error("Create Withdrawal Method Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create withdrawal method.",
    });
  }
};
/*
============================================================
CREATE WITHDRAWAL
============================================================
*/

export const createWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { methodId, amount, accountNumber, walletAddress, accountName } =
      req.body || {};

    /*
    --------------------------------------------------------
    BASIC VALIDATION
    --------------------------------------------------------
    */

    if (!methodId) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal method is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method.",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid amount.",
      });
    }

    /*
    --------------------------------------------------------
    GET USER
    --------------------------------------------------------
    */

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const userBalance = Number((user as any).balance || 0);

    if (numericAmount > userBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    /*
    --------------------------------------------------------
    GET METHOD
    --------------------------------------------------------
    */

    const method = await WithdrawalMethod.findById(methodId).lean();

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal method not found.",
      });
    }

    /*
    --------------------------------------------------------
    MIN / MAX
    --------------------------------------------------------
    */

    const minimum = Number((method as any).minAmount) || 10;

    const maximum = Number((method as any).maxAmount) || 0;

    if (numericAmount < minimum) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${minimum}.`,
      });
    }

    if (maximum > 0 && numericAmount > maximum) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal amount is ${maximum}.`,
      });
    }

    /*
    --------------------------------------------------------
    GET SAVED ACCOUNT
    --------------------------------------------------------
    */

    const savedAccount = await WithdrawalAccount.findOne({
      user: userId,
      methodId,
    }).lean();

    if (!savedAccount) {
      return res.status(400).json({
        success: false,
        message: "Please setup your withdrawal account first.",
      });
    }

    /*
    --------------------------------------------------------
    DETERMINE ACCOUNT
    --------------------------------------------------------
    */

    const methodType = String((method as any).type || "").toLowerCase();

    const isUsdt = methodType === "usdt";

    const finalAccountNumber = isUsdt
      ? undefined
      : savedAccount.accountNumber || accountNumber;

    const finalWalletAddress = isUsdt
      ? savedAccount.walletAddress || walletAddress
      : undefined;

    const finalAccountName = isUsdt
      ? undefined
      : savedAccount.accountName || accountName;

    if (isUsdt) {
      if (!finalWalletAddress) {
        return res.status(400).json({
          success: false,
          message: "USDT wallet address is missing.",
        });
      }
    } else {
      if (!finalAccountNumber) {
        return res.status(400).json({
          success: false,
          message: "Account number is missing.",
        });
      }

      if (!finalAccountName) {
        return res.status(400).json({
          success: false,
          message: "Account holder name is missing.",
        });
      }
    }

    /*
    --------------------------------------------------------
    PREVENT MULTIPLE PENDING REQUESTS
    --------------------------------------------------------
    OPTIONAL
    --------------------------------------------------------
    */

    const existingPending = await Withdrawal.findOne({
      user: userId,
      status: "pending",
    }).lean();

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending withdrawal request.",
      });
    }



    /*
    --------------------------------------------------------
    CREATE WITHDRAWAL
    --------------------------------------------------------
    */

    try {
      const withdrawal = await Withdrawal.create({
        user: userId,

        method:
          (method as any).name || (method as any).paymentName || "Withdrawal",

        methodId,

        amount: numericAmount,

        accountNumber: finalAccountNumber,

        walletAddress: finalWalletAddress,

        accountName: finalAccountName,

        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully.",
        data: {
          withdrawal,
        },
      });
    } catch (createError) {


      throw createError
    }
  } catch (error) {
    console.error("createWithdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit withdrawal request.",
    });
  }
};

/*
============================================================
WITHDRAWAL HISTORY
============================================================
*/

export const getWithdrawalHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const withdrawals = await Withdrawal.find({
      user: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      data: withdrawals,
    });
  } catch (error) {
    console.error("getWithdrawalHistory error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load withdrawal history.",
    });
  }
};

// GET ALL WITHDRAWAL REQUESTS
// =========================================================

export const getAdminWithdrawalRequests = async (
  req: Request,
  res: Response,
) => {
  try {
    // =====================================================
    // GET ALL WITHDRAWAL REQUESTS
    // =====================================================

    const withdrawals = await Withdrawal.find({})
      .sort({
        createdAt: -1,
      })
      .lean();

    // =====================================================
    // GET USER + WITHDRAWAL METHOD FOR EACH REQUEST
    // =====================================================

    const requests = await Promise.all(
      withdrawals.map(async (withdrawal: any) => {
        // -------------------------------------------------
        // USER
        // -------------------------------------------------

        const user = await User.findById(withdrawal.user)
          .select("-password -otp -otpExpiry")
          .lean();

        // -------------------------------------------------
        // WITHDRAWAL METHOD
        // -------------------------------------------------

        const withdrawalMethod = await PaymentSetting.findById(
          withdrawal.methodId,
        ).lean();

        // -------------------------------------------------
        // RETURN REQUEST
        // -------------------------------------------------

        return {
          ...withdrawal,

          user: user || null,

          withdrawalMethod: withdrawalMethod || null,
        };
      }),
    );

    // =====================================================
    // SPLIT REQUESTS
    // =====================================================

    const pending = requests.filter(
      (item: any) => String(item.status).toLowerCase() === "pending",
    );

    const rejected = requests.filter(
      (item: any) => String(item.status).toLowerCase() === "rejected",
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      data: {
        all: requests,
        pending,
        rejected,
      },
    });
  } catch (error: any) {
    console.error("getAdminWithdrawalRequests error:", error);

    console.error("ERROR MESSAGE:", error?.message);

    console.error("ERROR STACK:", error?.stack);

    return res.status(500).json({
      success: false,
      message: "Failed to get withdrawal requests.",
    });
  }
};

export const updateWithdrawalStatus = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending withdrawals can be updated.",
      });
    }


    const user = await User.findById(withdrawal?.user);

    if (!user) {
      throw new Error("User not found");
    }

    user.recharge = Number(withdrawal?.amount);


    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user.id,
        balance: {
          $gte: withdrawal.amount,
        },
      },
      {
        $inc: {
          balance: -withdrawal.amount,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

     withdrawal.status = status;
    await user.save();
    await withdrawal.save();

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "Withdrawal approved successfully."
          : "Withdrawal rejected successfully.",
      data: {
        withdrawal,
      },
    });
  } catch (error) {
    console.error("updateWithdrawalStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update withdrawal status.",
    });
  }
};
