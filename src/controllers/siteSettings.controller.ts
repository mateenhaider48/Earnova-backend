import { Request, Response } from "express";
import SiteSettings from "../models/siteSettings.model";

// =========================
// GET SETTINGS
// Public / User
// =========================

export const getSiteSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let settings = await SiteSettings.findOne();

    // Agar settings exist nahi karti
    // to default settings create karo
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get Site Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get site settings",
    });
  }
};

// =========================
// UPDATE SETTINGS
// Admin Only
// =========================

export const updateSiteSettings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      // =========================
      // SITE INFO
      // =========================

      siteName,
      favicon,

      // =========================
      // MAIN COLORS
      // =========================

      primaryColor,
      secondaryColor,
      backgroundColor,
      cardColor,
      textColor,

      // =========================
      // GRADIENT
      // =========================

      gradientStart,
      gradientEnd,

      // =========================
      // BUTTON
      // =========================

      buttonColor,
      buttonTextColor,

      // =========================
      // SIDEBAR / HEADER
      // =========================

      sidebarColor,
      headerColor,

      // =========================
      // LAYOUT
      // =========================

      gridColumns,
      borderRadius,

      // =========================
      // DASHBOARD CARD COLORS
      // =========================

      dashboardCardColors,
    } = req.body;

    let settings = await SiteSettings.findOne();

    // Agar settings exist nahi karti
    // to new settings document banao
    if (!settings) {
      settings = new SiteSettings();
    }

    // =========================
    // SITE INFO
    // =========================

    if (siteName !== undefined) {
      settings.siteName = siteName;
    }

    if (favicon !== undefined) {
      settings.favicon = favicon;
    }

    // =========================
    // MAIN COLORS
    // =========================

    if (primaryColor !== undefined) {
      settings.primaryColor = primaryColor;
    }

    if (secondaryColor !== undefined) {
      settings.secondaryColor = secondaryColor;
    }

    if (backgroundColor !== undefined) {
      settings.backgroundColor = backgroundColor;
    }

    if (cardColor !== undefined) {
      settings.cardColor = cardColor;
    }

    if (textColor !== undefined) {
      settings.textColor = textColor;
    }

    // =========================
    // GRADIENT COLORS
    // =========================

    if (gradientStart !== undefined) {
      settings.gradientStart = gradientStart;
    }

    if (gradientEnd !== undefined) {
      settings.gradientEnd = gradientEnd;
    }

    // =========================
    // BUTTON
    // =========================

    if (buttonColor !== undefined) {
      settings.buttonColor = buttonColor;
    }

    if (buttonTextColor !== undefined) {
      settings.buttonTextColor = buttonTextColor;
    }

    // =========================
    // SIDEBAR / HEADER
    // =========================

    if (sidebarColor !== undefined) {
      settings.sidebarColor = sidebarColor;
    }

    if (headerColor !== undefined) {
      settings.headerColor = headerColor;
    }

    // =========================
    // LAYOUT
    // =========================

    if (gridColumns !== undefined) {
      settings.gridColumns = Number(gridColumns);
    }

    if (borderRadius !== undefined) {
      settings.borderRadius = borderRadius;
    }

    // ========================================================
    // DASHBOARD CARD ICON COLORS
    // ========================================================

    if (
      dashboardCardColors !== undefined &&
      dashboardCardColors !== null
    ) {
      settings.dashboardCardColors = {
        ...settings.dashboardCardColors,

        ...(dashboardCardColors.deposit !== undefined
          ? {
              deposit: dashboardCardColors.deposit,
            }
          : {}),

        ...(dashboardCardColors.withdraw !== undefined
          ? {
              withdraw: dashboardCardColors.withdraw,
            }
          : {}),

        ...(dashboardCardColors.task !== undefined
          ? {
              task: dashboardCardColors.task,
            }
          : {}),

        ...(dashboardCardColors.team !== undefined
          ? {
              team: dashboardCardColors.team,
            }
          : {}),

        ...(dashboardCardColors.plan !== undefined
          ? {
              plan: dashboardCardColors.plan,
            }
          : {}),

        ...(dashboardCardColors.support !== undefined
          ? {
              support: dashboardCardColors.support,
            }
          : {}),

        ...(dashboardCardColors.youtube !== undefined
          ? {
              youtube: dashboardCardColors.youtube,
            }
          : {}),

        ...(dashboardCardColors.income !== undefined
          ? {
              income: dashboardCardColors.income,
            }
          : {}),
      };
    }

    // =========================
    // SAVE SETTINGS
    // =========================

    await settings.save();

    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,
      message: "Site settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update Site Settings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update site settings",
    });
  }
};