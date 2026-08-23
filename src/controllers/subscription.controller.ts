import { Request, Response } from "express";

import Subscription from "../models/subscription.model";

import {
  uploadToCloudinary,
} from "../utils/uploadToCloudinary";

// ============================================================
// CREATE SUBSCRIPTION
// ============================================================

export const createSubscription = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const {
      planName,
      amount,
      dailyAds,
      amountPerAd,
      planTimeLimit,
      isActive,
    } = req.body || {};

    // ========================================================
    // IMAGE
    // ========================================================

    const planImageFile =
      req.file;

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      typeof planName !== "string" ||
      !planName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Plan name is required.",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      Number.isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid amount is required.",
      });
    }

    if (
      dailyAds === undefined ||
      dailyAds === null ||
      dailyAds === "" ||
      Number.isNaN(Number(dailyAds)) ||
      Number(dailyAds) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid daily ads value is required.",
      });
    }

    if (
      amountPerAd === undefined ||
      amountPerAd === null ||
      amountPerAd === "" ||
      Number.isNaN(Number(amountPerAd)) ||
      Number(amountPerAd) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid amount per ad is required.",
      });
    }

    if (
      planTimeLimit === undefined ||
      planTimeLimit === null ||
      planTimeLimit === "" ||
      Number.isNaN(Number(planTimeLimit)) ||
      Number(planTimeLimit) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid plan time limit is required.",
      });
    }

    // ========================================================
    // ACTIVE
    // ========================================================

    let active = true;

    if (isActive !== undefined) {
      if (
        typeof isActive === "boolean"
      ) {
        active = isActive;
      } else if (
        typeof isActive === "string"
      ) {
        active =
          isActive.toLowerCase() ===
          "true";
      } else {
        active = Boolean(isActive);
      }
    }

    // ========================================================
    // CLOUDINARY
    // OPTIONAL IMAGE
    // ========================================================

    let planImage:
      | string
      | null = null;

    if (planImageFile) {
      const uploaded =
        await uploadToCloudinary(
          planImageFile
        );

      planImage =
        uploaded.url;
    }

    // ========================================================
    // CREATE PLAN
    // ========================================================

    const subscription =
      await Subscription.create({
        planName:
          planName.trim(),

        amount:
          Number(amount),

        dailyAds:
          Number(dailyAds),

        amountPerAd:
          Number(amountPerAd),

        planTimeLimit:
          Number(planTimeLimit),

        isActive:
          active,

        planImage,
      });

    return res.status(201).json({
      success: true,
      message:
        "Subscription created successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error(
      "Create Subscription Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// ============================================================
// GET ALL SUBSCRIPTIONS
// ============================================================

export const getAllSubscriptions = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const subscriptions =
      await Subscription.find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error(
      "Get Subscriptions Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// ============================================================
// GET SINGLE SUBSCRIPTION
// ============================================================

export const getSubscriptionById = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const subscription =
      await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message:
          "Subscription not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    console.error(
      "Get Subscription Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// ============================================================
// UPDATE SUBSCRIPTION
// ============================================================
export const updateSubscription = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    // ========================================================
    // FIND PLAN
    // ========================================================

    const subscription =
      await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found.",
      });
    }

    // ========================================================
    // BODY
    // ========================================================

    const {
      planName,
      amount,
      dailyAds,
      amountPerAd,
      planTimeLimit,
      isActive,
    } = req.body || {};

    // ========================================================
    // IMAGE
    // Frontend field name MUST be: planImage
    // ========================================================

    const planImageFile = req.file;

    // ========================================================
    // PLAN NAME
    // ========================================================

    if (planName !== undefined) {
      if (
        typeof planName !== "string" ||
        !planName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Plan name is required.",
        });
      }

      subscription.planName =
        planName.trim();
    }

    // ========================================================
    // AMOUNT
    // ========================================================

    if (
      amount !== undefined &&
      amount !== ""
    ) {
      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      subscription.amount =
        numericAmount;
    }

    // ========================================================
    // DAILY ADS
    // ========================================================

    if (
      dailyAds !== undefined &&
      dailyAds !== ""
    ) {
      const numericDailyAds =
        Number(dailyAds);

      if (
        !Number.isFinite(numericDailyAds) ||
        numericDailyAds <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid daily ads value.",
        });
      }

      subscription.dailyAds =
        numericDailyAds;
    }

    // ========================================================
    // AMOUNT PER AD
    // ========================================================

    if (
      amountPerAd !== undefined &&
      amountPerAd !== ""
    ) {
      const numericAmountPerAd =
        Number(amountPerAd);

      if (
        !Number.isFinite(
          numericAmountPerAd,
        ) ||
        numericAmountPerAd <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid amount per ad.",
        });
      }

      subscription.amountPerAd =
        numericAmountPerAd;
    }

    // ========================================================
    // PLAN TIME LIMIT
    // ========================================================

    if (
      planTimeLimit !== undefined &&
      planTimeLimit !== ""
    ) {
      const numericPlanTimeLimit =
        Number(planTimeLimit);

      if (
        !Number.isFinite(
          numericPlanTimeLimit,
        ) ||
        numericPlanTimeLimit <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid plan time limit.",
        });
      }

      subscription.planTimeLimit =
        numericPlanTimeLimit;
    }

    // ========================================================
    // ACTIVE
    // ========================================================

    if (isActive !== undefined) {
      if (
        typeof isActive === "boolean"
      ) {
        subscription.isActive =
          isActive;
      } else if (
        typeof isActive === "string"
      ) {
        subscription.isActive =
          isActive.toLowerCase() ===
          "true";
      } else {
        subscription.isActive =
          Boolean(isActive);
      }
    }

    // ========================================================
    // IMAGE UPDATE
    // OPTIONAL
    //
    // Agar new image nahi bheji gayi:
    // purani image same rahegi.
    //
    // Agar new image bheji gayi:
    // Cloudinary URL update ho jayega.
    // ========================================================

    if (planImageFile) {
      console.log(
        "New subscription image received:",
        planImageFile.originalname,
      );

      const uploaded =
        await uploadToCloudinary(
          planImageFile,
          "subscription-plans",
        );

      subscription.planImage =
        uploaded.url;
    }

    // ========================================================
    // SAVE
    // ========================================================

    await subscription.save();

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,
      message:
        "Subscription updated successfully.",
      data: subscription,
    });
  } catch (error) {
    console.error(
      "Update Subscription Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};


// ============================================================
// DELETE SUBSCRIPTION
// ============================================================

export const deleteSubscription = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    const subscription =
      await Subscription.findByIdAndDelete(
        id,
      );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message:
          "Subscription not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Subscription deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Subscription Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};
