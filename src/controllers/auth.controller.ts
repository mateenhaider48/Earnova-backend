import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middleware/authCheck.middleware";
import User from "../models/user.model";
import { generateToken, genRefreshToken } from "../utils/generateToken";
import crypto from "crypto";

// ========================= Register =========================

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { name, cellNo, password, reflink } = req.body;

    // Validation
    if (!name || !cellNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Cell Number and Password are required.",
      });
    }


    const pakistanPhoneRegex = /^(?:\+92|92|0)3[0-9]{2}[0-9]{7}$/;

    if (!pakistanPhoneRegex.test(cellNo)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Pakistani mobile number.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // Existing user
    const existingUser = await User.findOne({ cellNo });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Referral validation (optional)
    let refBy = null;

    if (reflink) {
      refBy =  reflink
    } 

    const referralCode = crypto.randomBytes(5).toString("hex").toUpperCase();
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      cellNo,
      password: hashedPassword,
      reflink: referralCode,
      refBy: refBy,
      role: "user",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        id: user._id,
        name: user.name,
        cellNo: user.cellNo,
        role: user.role,
        referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.reflink}`
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering.",
    });
  }
};

// ========================= Login =========================

export const loginUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { cellNo, password } = req.body;

    if (!cellNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Cell Number and Password are required.",
      });
    }

    // Find user
    const user = await User.findOne({ cellNo });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid Cell Number or Password.",
      });
    }

    // Verify password
    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid Cell Number or Password.",
      });
    }

    // Generate Tokens
    const accessToken = generateToken(user._id, user.role);

    const refreshToken = genRefreshToken(user._id, user.role);

    // Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          cellNo: user.cellNo,
          role: user.role,
          referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.reflink}`
        },
        token: accessToken,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging in.",
    });
  }
};

// ========================= Logout =========================

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while logging out.",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { cellNo } = req.body;

    if (!cellNo) {
      return res.status(400).json({
        success: false,
        message: "Cell Number is required.",
      });
    }

    const user = await User.findOne({ cellNo });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire after 10 minutes
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    // TODO:
    // Send OTP through SMS API

    return res.status(200).json({
      success: true,
      message: "OTP generated successfully.",
      otp, // Remove this in production
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { cellNo, otp } = req.body;

    if (!cellNo || !otp) {
      return res.status(400).json({
        success: false,
        message: "Cell Number and OTP are required.",
      });
    }

    const user = await User.findOne({ cellNo });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP not found.",
      });
    }

    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { cellNo, otp, password } = req.body;
    if (!cellNo || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const user = await User.findOne({ cellNo });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired.",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// ========================= Change Password =========================

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(req.user?.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check current password
    const isPasswordMatched = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Prevent using the same password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the current password.",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while changing password.",
    });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const users = await User.find()
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

export const getMe = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId)
      .select("-password")
      .populate({
        path: "subscription",
        select: "planName name activePlanImage",
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("getMe error:", err);

    return res.status(500).json({
      success: false,
      message:
        err instanceof Error
          ? err.message
          : "Internal Server Error",
    });
  }
};


/*
============================================================
GET USER TEAM
============================================================

LEVEL 1:
refBy === loggedInUser.refLink

LEVEL 2:
refBy === any Level 1 user's refLink

LEVEL 3:
refBy === any Level 2 user's refLink

...and so on
============================================================
*/

export const getTeams = async (req: any, res: any) => {
  try {
    /*
    ============================================================
    CURRENT LOGIN USER
    ============================================================
    */

    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const currentUser = await User.findById(currentUserId)
      .select("_id name reflink")
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
    ============================================================
    CURRENT USER REFERRAL CODE
    ============================================================
    */

    
      

   

    if (!currentUser.reflink) {
      return res.status(200).json({
        success: true,
        data: {
          level1: [],
          level2: [],
          level3: [],
          teamMembers: [],
          totalRecharge: 0,
          totalWithdraw: 0,
          level1Count: 0,
          level2Count: 0,
          level3Count: 0,
          totalMembers: 0,
        },
      });
    }

    /*
    ============================================================
    LEVEL 1
    ============================================================
*/
 

    const level1Users = await User.find({
      refBy: currentUser.reflink,
    })
      .select(
        "_id name cellNo reflink refBy recharge withdrawl status"
      )
      .lean();

    console.log(
      "LEVEL 1 USERS:",
      level1Users
    );

    /*
    ============================================================
    LEVEL 1 FORMAT
    ============================================================
    */

    const level1 = level1Users.map(
      (user: any) => ({
        id: String(user._id),

        name:
          user.name || "User",

        phone:
          user.cellNo ||
          user.phone ||
          "",

        level: 1,

        recharge: Number(
          user.recharge ?? 0
        ),

        withdraw: Number(
          user.withdrawl ?? 0
        ),

        status:
          user.status === "Active"
            ? "Active"
            : "Inactive",
      })
    );

    /*
    ============================================================
    LEVEL 2
    ============================================================

    Level 1 users ke reflink:

    User A reflink = "xyz"

    Find:

    refBy = "xyz"
    */

    const level1RefLinks =
      level1Users
        .map(
          (user: any) =>
            String(user.reflink || "").trim()
        )
        .filter(Boolean);

    console.log(
      "LEVEL 1 REFLINKS:",
      level1RefLinks
    );

    let level2Users: any[] = [];

    if (level1RefLinks.length > 0) {
      level2Users = await User.find({
        refBy: {
          $in: level1RefLinks,
        },
      })
        .select(
          "_id name cellNo reflink refBy recharge withdrawl status"
        )
        .lean();
    }

    console.log(
      "LEVEL 2 USERS:",
      level2Users
    );

    /*
    ============================================================
    LEVEL 2 FORMAT
    ============================================================
    */

    const level2 = level2Users.map(
      (user: any) => ({
        id: String(user._id),

        name:
          user.name || "User",

        phone:
          user.cellNo ||
          user.phone ||
          "",

        level: 2,

        recharge: Number(
          user.recharge ?? 0
        ),

        withdraw: Number(
          user.withdrawl ?? 0
        ),

        status:
          user.status === "Active"
            ? "Active"
            : "Inactive",
      })
    );

    /*
    ============================================================
    LEVEL 3
    ============================================================

    Level 2 users ke reflink:

    User B reflink = "pqr"

    Find:

    refBy = "pqr"
    */

    const level2RefLinks =
      level2Users
        .map(
          (user: any) =>
            String(user.reflink || "").trim()
        )
        .filter(Boolean);

    console.log(
      "LEVEL 2 REFLINKS:",
      level2RefLinks
    );

    let level3Users: any[] = [];

    if (level2RefLinks.length > 0) {
      level3Users = await User.find({
        refBy: {
          $in: level2RefLinks,
        },
      })
        .select(
          "_id name cellNo reflink refBy recharge withdrawl status"
        )
        .lean();
    }

    console.log(
      "LEVEL 3 USERS:",
      level3Users
    );

    /*
    ============================================================
    LEVEL 3 FORMAT
    ============================================================
    */

    const level3 = level3Users.map(
      (user: any) => ({
        id: String(user._id),

        name:
          user.name || "User",

        phone:
          user.cellNo ||
          user.phone ||
          "",

        level: 3,

        recharge: Number(
          user.recharge ?? 0
        ),

        withdraw: Number(
          user.withdrawl ?? 0
        ),

        status:
          user.status === "Active"
            ? "Active"
            : "Inactive",
      })
    );

    /*
    ============================================================
    ALL TEAM
    ============================================================
    */

    const teamMembers = [
      ...level1,
      ...level2,
      ...level3,
    ];

    /*
    ============================================================
    TOTAL RECHARGE
    ============================================================
    */

    const totalRecharge =
      teamMembers.reduce(
        (total, member) =>
          total +
          Number(member.recharge || 0),
        0
      );

    /*
    ============================================================
    TOTAL WITHDRAW
    ============================================================
    */

    const totalWithdraw =
      teamMembers.reduce(
        (total, member) =>
          total +
          Number(member.withdraw || 0),
        0
      );

    /*
    ============================================================
    RESPONSE
    ============================================================
    */

    return res.status(200).json({
      success: true,

      data: {
        level1,
        level2,
        level3,

        teamMembers,

        totalRecharge,
        totalWithdraw,

        level1Count:
          level1.length,

        level2Count:
          level2.length,

        level3Count:
          level3.length,

        totalMembers:
          teamMembers.length,
      },
    });
  } catch (error) {
    console.error(
      "Get Teams Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get team members",
    });
  }
};