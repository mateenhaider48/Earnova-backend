
import { Request, Response } from "express";
import mongoose from "mongoose";

import Ad from "../models/ads.model";
import User from "../models/user.model";
import Subscription from "../models/subscription.model";
import UserAdAssignment from "../models/userAdAssignment.model";

import {
  uploadToCloudinary,
} from "../utils/uploadToCloudinary";

// =========================================================
// HELPER
// =========================================================

const getUserId = (req: Request) => {
  return req.user?.id;
};

// =========================================================
// CREATE AD
//
// ADMIN
//
// IMPORTANT:
// Yahan subscription / plan required nahi hai.
// =========================================================

export const createAd = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      title,
      description,
      isActive,
    } = req.body;

    // =====================================================
    // TITLE
    // =====================================================

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ad title is required.",
      });
    }

    // =====================================================
    // FILE
    // =====================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Image or video file is required.",
      });
    }

    // =====================================================
    // MEDIA TYPE
    // =====================================================

    let type:
      | "image"
      | "video";

    if (
      req.file.mimetype.startsWith(
        "image/"
      )
    ) {
      type = "image";
    } else if (
      req.file.mimetype.startsWith(
        "video/"
      )
    ) {
      type = "video";
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Only image or video files are allowed.",
      });
    }

    // =====================================================
    // CLOUDINARY
    // =====================================================

    const uploadedMedia =
      await uploadToCloudinary(
        req.file,
        "ads"
      );

    const mediaUrl =
      uploadedMedia.url;

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message:
          "Media URL could not be generated.",
      });
    }

    // =====================================================
    // CREATE AD
    // =====================================================

    const ad = await Ad.create({
      title: title.trim(),

      description:
        description?.trim() || "",

      type,

      mediaUrl,

      isActive:
        isActive === undefined
          ? true
          : isActive === true ||
            isActive === "true",
    });

    return res.status(201).json({
      success: true,
      message:
        "Advertisement created successfully.",
      data: ad,
    });
  } catch (error) {
    console.error(
      "Create Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating advertisement.",
    });
  }
};

// =========================================================
// GET ALL ADS
//
// ADMIN
// =========================================================

export const getAllAds = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const ads = await Ad.find()
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error(
      "Get Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// =========================================================
// GET SINGLE AD
//
// ADMIN
// =========================================================

export const getAdById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Array.isArray(
      req.params.id
    )
      ? req.params.id[0]
      : req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID.",
      });
    }

    const ad =
      await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error(
      "Get Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// =========================================================
// UPDATE AD
//
// ADMIN
//
// Subscription completely removed.
// =========================================================

export const updateAd = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Array.isArray(
      req.params.id
    )
      ? req.params.id[0]
      : req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID.",
      });
    }

    const {
      title,
      description,
      isActive,
    } = req.body;

    // =====================================================
    // FIND AD
    // =====================================================

    const ad =
      await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found.",
      });
    }

    // =====================================================
    // TITLE
    // =====================================================

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Ad title cannot be empty.",
        });
      }

      ad.title =
        title.trim();
    }

    // =====================================================
    // DESCRIPTION
    // =====================================================

    if (
      description !== undefined
    ) {
      ad.description =
        description.trim();
    }

    // =====================================================
    // ACTIVE STATUS
    // =====================================================

    if (
      isActive !== undefined
    ) {
      ad.isActive =
        isActive === true ||
        isActive === "true";
    }

    // =====================================================
    // MEDIA UPDATE
    // =====================================================

    if (req.file) {
      let type:
        | "image"
        | "video";

      if (
        req.file.mimetype.startsWith(
          "image/"
        )
      ) {
        type = "image";
      } else if (
        req.file.mimetype.startsWith(
          "video/"
        )
      ) {
        type = "video";
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Only image or video files are allowed.",
        });
      }

      const uploadedMedia =
        await uploadToCloudinary(
          req.file,
          "ads"
        );

      if (!uploadedMedia.url) {
        return res.status(400).json({
          success: false,
          message:
            "Media URL could not be generated.",
        });
      }

      ad.mediaUrl =
        uploadedMedia.url;

      ad.type = type;
    }

    // =====================================================
    // SAVE
    // =====================================================

    await ad.save();

    return res.status(200).json({
      success: true,
      message:
        "Advertisement updated successfully.",
      data: ad,
    });
  } catch (error) {
    console.error(
      "Update Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating advertisement.",
    });
  }
};

// =========================================================
// TOGGLE AD STATUS
//
// ADMIN
// =========================================================

export const toggleAdStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Array.isArray(
      req.params.id
    )
      ? req.params.id[0]
      : req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID.",
      });
    }

    const ad =
      await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found.",
      });
    }

    ad.isActive =
      !ad.isActive;

    await ad.save();

    return res.status(200).json({
      success: true,
      message: `Advertisement ${
        ad.isActive
          ? "activated"
          : "deactivated"
      } successfully.`,
      data: {
        id: ad._id,
        isActive:
          ad.isActive,
      },
    });
  } catch (error) {
    console.error(
      "Toggle Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// =========================================================
// DELETE AD
//
// ADMIN
// =========================================================

export const deleteAd = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Array.isArray(
      req.params.id
    )
      ? req.params.id[0]
      : req.params.id;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID.",
      });
    }

    const ad =
      await Ad.findByIdAndDelete(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found.",
      });
    }

    // =====================================================
    // REMOVE ASSIGNMENTS TOO
    // =====================================================

    await UserAdAssignment.deleteMany({
      ad: ad._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Advertisement deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong.",
    });
  }
};

// =========================================================
// GET RANDOM ADS OF LOGGED-IN USER
//
// USER
//
// FLOW:
//
// 1. Login user
// 2. Current subscription
// 3. Subscription dailyAds
// 4. Existing assignments within 24h?
// 5. YES => same ads
// 6. NO => new random ads
// =========================================================

export const getAllAdsOfLoginUser =
  async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      // ===================================================
      // USER ID
      // ===================================================

      const userId = getUserId(req);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User not found.",
        });
      }

      // ===================================================
      // USER
      // ===================================================

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ===================================================
      // SUBSCRIPTION CHECK
      // ===================================================

      if (!user.subscription) {
        return res.status(400).json({
          success: false,
          message: "You have not purchased any subscription.",
        });
      }

      // ===================================================
      // CHECK SUBSCRIPTION EXPIRY
      // ===================================================

      const now = new Date();

      if (
        user.subscriptionEndDate &&
        user.subscriptionEndDate <= now
      ) {
        return res.status(400).json({
          success: false,
          message: "Your subscription has expired.",
        });
      }

      // ===================================================
      // CURRENT SUBSCRIPTION
      // ===================================================

      const subscription =
        await Subscription.findById(
          user.subscription
        );

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Your subscription was not found.",
        });
      }

      // ===================================================
      // SUBSCRIPTION ACTIVE CHECK
      // ===================================================

      if (subscription.isActive === false) {
        return res.status(400).json({
          success: false,
          message: "Your subscription is not active.",
        });
      }

      // ===================================================
      // DAILY ADS
      // ===================================================

      const dailyAds = Math.max(
        0,
        Number(subscription.dailyAds || 0)
      );

      if (dailyAds <= 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          dailyAds: 0,
          data: [],
          message:
            "Your subscription has no daily ads.",
        });
      }

      // ===================================================
      // CURRENT 24-HOUR ASSIGNMENTS
      // ===================================================

      const currentAssignments =
        await UserAdAssignment.find({
          user: userId,
          expiresAt: {
            $gt: now,
          },
        })
          .populate("ad")
          .sort({
            assignedAt: 1,
          });

      // ===================================================
      // ONLY ACTIVE ADS
      // ===================================================

      const validAssignments =
        currentAssignments.filter(
          (assignment: any) => {
            return (
              assignment.ad &&
              assignment.ad.isActive === true
            );
          }
        );

      // ===================================================
      // IMPORTANT
      //
      // User ko sirf subscription.dailyAds
      // ke according ads milenge.
      //
      // Example:
      // dailyAds = 5
      // assignments = 10
      //
      // response = only 5 ads
      // ===================================================

      if (
        validAssignments.length >= dailyAds
      ) {
        const ads =
          validAssignments
            .slice(0, dailyAds)
            .map(
              (assignment: any) =>
                assignment.ad
            );

        return res.status(200).json({
          success: true,
          count: ads.length,
          dailyAds,
          assignmentExpiresAt:
            validAssignments[0]?.expiresAt,
          data: ads,
        });
      }

      // ===================================================
      // CURRENT ASSIGNMENTS LESS THAN DAILY ADS
      //
      // Example:
      // dailyAds = 5
      // existing = 2
      //
      // Need 3 more ads.
      // ===================================================

      const existingAdIds =
        validAssignments.map(
          (assignment: any) =>
            assignment.ad._id
        );

      const remainingAds =
        dailyAds -
        validAssignments.length;

      // ===================================================
      // RANDOM ACTIVE ADS
      //
      // Existing ads dobara select nahi honge.
      // ===================================================

      const randomAds =
        await Ad.aggregate([
          {
            $match: {
              isActive: true,

              _id: {
                $nin: existingAdIds,
              },
            },
          },

          {
            $sample: {
              size: remainingAds,
            },
          },
        ]);

      // ===================================================
      // IF NO NEW ADS
      // ===================================================

      if (
        randomAds.length === 0
      ) {
        const existingAds =
          validAssignments
            .slice(0, dailyAds)
            .map(
              (assignment: any) =>
                assignment.ad
            );

        return res.status(200).json({
          success: true,
          count: existingAds.length,
          dailyAds,
          assignmentExpiresAt:
            validAssignments[0]?.expiresAt,
          data: existingAds,
          message:
            "No additional active advertisements are available.",
        });
      }

      // ===================================================
      // 24 HOURS EXPIRY
      // ===================================================

      const expiresAt =
        new Date(
          now.getTime() +
            24 *
              60 *
              60 *
              1000
        );

      // ===================================================
      // CREATE NEW ASSIGNMENTS
      // ===================================================

      const assignments =
        randomAds.map(
          (ad: any) => ({
            user: userId,
            ad: ad._id,
            assignedAt: now,
            expiresAt,
            viewedAt: null,
          })
        );

      await UserAdAssignment.insertMany(
        assignments
      );

      // ===================================================
      // FINAL ADS
      //
      // Existing + new
      // EXACTLY dailyAds
      // ===================================================

      const existingAds =
        validAssignments.map(
          (assignment: any) =>
            assignment.ad
        );

      const allAds = [
        ...existingAds,
        ...randomAds,
      ].slice(0, dailyAds);

      // ===================================================
      // RESPONSE
      // ===================================================

      return res.status(200).json({
        success: true,
        count: allAds.length,
        dailyAds,
        assignmentExpiresAt:
          expiresAt,
        data: allAds,
      });

    } catch (error) {
      console.error(
        "Get User Random Ads Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while getting advertisements.",
      });
    }
  };

// =========================================================
// COMPLETE / VIEW AD
//
// USER
//
// IMPORTANT:
//
// YAHAN KOI REWARD NAHI MILEGA.
//
// Sirf viewedAt set hoga.
//
// Reward ka controller alag hoga.
// =========================================================

export const completeAd = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // ===================================================
    // USER
    // ===================================================

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized. User not found.",
      });
    }

    // ===================================================
    // AD ID
    // ===================================================

    const adId = Array.isArray(
      req.params.adId
    )
      ? req.params.adId[0]
      : req.params.adId;

    if (
      !mongoose.Types.ObjectId.isValid(
        adId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID.",
      });
    }

    // ===================================================
    // FIND ASSIGNMENT
    //
    // User ko wahi ad complete karne diya jayega jo usko
    // current 24-hour cycle mein assigned hua ho.
    // ===================================================

    const assignment =
      await UserAdAssignment.findOne({
        user: userId,
        ad: adId,
        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message:
          "This advertisement is not assigned to you or its 24-hour period has expired.",
      });
    }

    // ===================================================
    // ALREADY VIEWED
    // ===================================================

    if (assignment.viewedAt) {
      return res.status(200).json({
        success: true,
        message:
          "Advertisement has already been completed.",
        data: {
          adId,
          viewedAt:
            assignment.viewedAt,
        },
      });
    }

    // ===================================================
    // MARK VIEWED
    //
    // NO REWARD HERE
    // ===================================================

    assignment.viewedAt =
      new Date();

    await assignment.save();

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      message:
        "Advertisement completed successfully.",
      data: {
        adId,
        viewedAt:
          assignment.viewedAt,
        rewardProcessed: false,
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