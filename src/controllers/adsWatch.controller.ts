import { Response } from "express";
import { AuthRequest } from "../middleware/authCheck.middleware";
import User from "../models/user.model";
import Subscription from "../models/subscription.model";
import Ad from "../models/ads.model";

export const completeAd = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { adId, rating } = req.body;

    // =====================================================
    // USER CHECK
    // =====================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!adId) {
      return res.status(400).json({
        success: false,
        message: "Ad ID is required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =====================================================
    // AD CHECK
    // =====================================================

    const ad = await Ad.findById(adId);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found.",
      });
    }

    if (!ad.isActive) {
      return res.status(400).json({
        success: false,
        message: "This advertisement is no longer active.",
      });
    }

    // =====================================================
    // RATING CHECK
    // =====================================================

    const numericRating = Number(rating);

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid rating between 1 and 5.",
      });
    }

    // =====================================================
    // SUBSCRIPTION CHECK
    // =====================================================

    if (!user.subscription) {
      return res.status(400).json({
        success: false,
        message:
          "You don't have an active subscription.",
      });
    }

    

   
    // =====================================================
    // GET SUBSCRIPTION
    // =====================================================

    const subscription =
      await Subscription.findById(
        user.subscription
      );

    if (
      !subscription ||
      !subscription.isActive
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Subscription is not active.",
      });
    }

    // =====================================================
    // DAILY ADS LIMIT
    // =====================================================

    if (
      user.watchedInCurrentCycle >=
      subscription.dailyAds
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You have completed all ads for this cycle.",
        data: {
          dailyAds:
            subscription.dailyAds,

          adsWatchedInCurrentCycle:
            user.watchedInCurrentCycle,
        },
      });
    }

    // =====================================================
    // CALCULATE AD EARNING
    //
    // amountPerAd = percentage
    //
    // Example:
    //
    // Balance = 1000
    // amountPerAd = 10
    //
    // 1000 * 10 / 100 = 100
    //
    // New Balance = 1100
    // =====================================================

    const currentBalance =
      Number(user.balance || 0);

    const amountPerAd =
      Number(
        subscription.amountPerAd || 0
      );

    if (
      !Number.isFinite(amountPerAd) ||
      amountPerAd <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid amount per ad percentage.",
      });
    }

    if (amountPerAd > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Amount per ad percentage cannot be greater than 100.",
      });
    }

    const adEarning =
      (currentBalance * amountPerAd) / 100;

    // =====================================================
    // INCREMENT WATCH COUNT
    // =====================================================

    user.watchedInCurrentCycle =
      Number(
        user.watchedInCurrentCycle || 0
      ) + 1;

    const currentWatched =
      user.watchedInCurrentCycle;

    // =====================================================
    // ADD EARNING TO BALANCE
    // =====================================================

    user.balance =
      currentBalance + adEarning;

    // =====================================================
    // ADD EARNING TO TOTAL EARNING
    // =====================================================

    user.earning =
      Number(user.earning || 0) +
      adEarning;

    // =====================================================
    // CYCLE COMPLETED
    // =====================================================

    const cycleCompleted =
      currentWatched >=
      subscription.dailyAds;

    // =====================================================
    // SAVE USER
    // =====================================================

    await user.save();

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        "Ad completed successfully. Your earning has been added to your balance.",

      data: {
        adId,

        rating: numericRating,

        // Subscription percentage
        amountPerAd,

        // Actual amount earned
        adEarning,

        // Balance before earning
        previousBalance:
          currentBalance,

        // Updated balance
        balance:
          user.balance,

        // Updated total earning
        earning:
          user.earning,

        // Cycle information
        adsWatchedInCurrentCycle:
          currentWatched,

        dailyAds:
          subscription.dailyAds,

        remainingAds:
          Math.max(
            subscription.dailyAds -
              currentWatched,
            0
          ),

        cycleCompleted,

        cycleStart:
          user.earningCycleStart,

        cycleEnd:
          user.earningCycleEnd,
      },
    });
  } catch (error) {
    console.error(
      "Complete Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while completing advertisement.",
    });
  }
};
