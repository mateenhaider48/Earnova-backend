import { Request, Response } from "express";
import Tutorial from "../models/tutorial.model"
import { uploadToCloudinary } from "../utils/uploadToCloudinary";
import Income from "../models/income.model";
import CompanyAds from "../models/companyAds.model";


/*
============================================================
CREATE TUTORIAL
============================================================
*/

export const createTutorial = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      description,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required.",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Description is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Image or video is required.",
      });
    }

    const isImage =
      req.file.mimetype.startsWith(
        "image/"
      );

    const isVideo =
      req.file.mimetype.startsWith(
        "video/"
      );

    if (!isImage && !isVideo) {
      return res.status(400).json({
        success: false,
        message:
          "Only image or video files are allowed.",
      });
    }

    const uploaded =
      await uploadToCloudinary(
        req.file
      );

    const tutorial =
      await Tutorial.create({
        title: title.trim(),

        description:
          description.trim(),

        mediaUrl:
          uploaded.url,

        mediaType:
          uploaded.resourceType,
      });

    return res.status(201).json({
      success: true,
      message:
        "Tutorial created successfully.",
      data: tutorial,
    });
  } catch (error) {
    console.error(
      "Create Tutorial Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create tutorial.",
    });
  }
};

/*
============================================================
GET ALL TUTORIALS
============================================================
*/

export const getTutorials = async (
  req: Request,
  res: Response
) => {
  try {
    const tutorials =
      await Tutorial.find()
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      data: tutorials,
    });
  } catch (error) {
    console.error(
      "Get Tutorials Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load tutorials.",
    });
  }
};

/*
============================================================
GET SINGLE TUTORIAL
============================================================
*/

export const getTutorialById = async (
  req: Request,
  res: Response
) => {
  try {
    const tutorial =
      await Tutorial.findById(
        req.params.id
      );

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message:
          "Tutorial not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: tutorial,
    });
  } catch (error) {
    console.error(
      "Get Tutorial Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load tutorial.",
    });
  }
};

/*
============================================================
UPDATE TUTORIAL
============================================================
*/

export const updateTutorial = async (
  req: Request,
  res: Response
) => {
  try {
    const tutorial =
      await Tutorial.findById(
        req.params.id
      );

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message:
          "Tutorial not found.",
      });
    }

    const {
      title,
      description,
    } = req.body;

    if (
      title !== undefined &&
      !String(title).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title cannot be empty.",
      });
    }

    if (
      description !== undefined &&
      !String(description).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description cannot be empty.",
      });
    }

    if (title !== undefined) {
      tutorial.title =
        String(title).trim();
    }

    if (description !== undefined) {
      tutorial.description =
        String(description).trim();
    }

    /*
    ----------------------------------------------------------
    OPTIONAL NEW IMAGE / VIDEO
    ----------------------------------------------------------
    */

    if (req.file) {
      const isImage =
        req.file.mimetype.startsWith(
          "image/"
        );

      const isVideo =
        req.file.mimetype.startsWith(
          "video/"
        );

      if (!isImage && !isVideo) {
        return res.status(400).json({
          success: false,
          message:
            "Only image or video files are allowed.",
        });
      }

      const uploaded =
        await uploadToCloudinary(
          req.file
        );

      tutorial.mediaUrl =
        uploaded.url;

      tutorial.mediaType =
        uploaded.resourceType;
    }

    await tutorial.save();

    return res.status(200).json({
      success: true,
      message:
        "Tutorial updated successfully.",
      data: tutorial,
    });
  } catch (error) {
    console.error(
      "Update Tutorial Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update tutorial.",
    });
  }
};

/*
============================================================
DELETE TUTORIAL
============================================================

mediaPublicId database mein nahi hai,
isliye yahan sirf MongoDB record delete hoga.
============================================================
*/

export const deleteTutorial = async (
  req: Request,
  res: Response
) => {
  try {
    const tutorial =
      await Tutorial.findByIdAndDelete(
        req.params.id
      );

    if (!tutorial) {
      return res.status(404).json({
        success: false,
        message:
          "Tutorial not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Tutorial deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Tutorial Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete tutorial.",
    });
  }
};


export const createIncome = async (req: any, res: any) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Income image is required",
      });
    }

    const uploadedImage = await uploadToCloudinary(
      req.file
    );

    const income = await Income.create({
      image: uploadedImage.url,
    });

    return res.status(201).json({
      success: true,
      message: "Income image uploaded successfully",
      data: income,
    });
  } catch (error) {
  

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload income image",
    });
  }
};

export const getIncome = async (req: any, res: any) => {
  try {
    const income = await Income.find({})

    return res.status(200).json({
      success: true,
      data: income,
    });
  } catch (error) {
    console.error("Get Income Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get income image",
    });
  }
};

export const createCompanyAd = async (req: any, res: any) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Ad image is required",
      });
    }

    const uploadedImage = await uploadToCloudinary(
      req.file
    );

    const companyAds = await CompanyAds.create({
      image: uploadedImage.url,
    });

    return res.status(201).json({
      success: true,
      message: "Ads image uploaded successfully",
      data: companyAds,
    });
  } catch (error) {
  

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload income image",
    });
  }
};

export const getCompanyAds = async (req: any, res: any) => {
  try {
    const companyAds = await CompanyAds.find({})

    return res.status(200).json({
      success: true,
      data: companyAds,
    });
  } catch (error) {
    console.error("Get Income Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get income image",
    });
  }
};

export const deleteCompanyAd = async (
  req: Request,
  res: Response
) => {
  try {
    const company =
      await CompanyAds.findByIdAndDelete(
        req.params.id
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message:
          "Company Ad not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Company Ad deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Company Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete Company Ad.",
    });
  }
};