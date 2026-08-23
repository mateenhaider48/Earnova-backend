import express from "express";

import authCheck, { authorized } from "../middleware/authCheck.middleware";

import {
  createDeposit,
  getDepositHistory,
  getPaymentRequestStatus,
  getPaymentSettings,
} from "../controllers/payment.controller";

import {
  getAllSubscriptions,
  getSubscriptionById,
} from "../controllers/subscription.controller";

import { getAllAdsOfLoginUser } from "../controllers/ads.controller";
import { completeAd } from "../controllers/adsWatch.controller";
import { getSiteSettings } from "../controllers/siteSettings.controller";
import { getMe, getTeams } from "../controllers/auth.controller";

import multer from "multer";
import { getCurrency } from "../controllers/currency.controller";
import { createWithdrawal, getWithdrawalAccount, getWithdrawalHistory, getWithdrawalMethods, saveWithdrawalAccount } from "../controllers/withdrawl.controller";
import { getSupport } from "../controllers/support.controller";
import { getIncome, getTutorials } from "../controllers/tutorial.controller";
import { checkSubscription, createBalanceRequest, createPaymentRequest, getMyRequests } from "../controllers/subscriptionRequest.controller";
const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

// ========================= User Routes =========================

router.get("/get-all-subscription", getAllSubscriptions);

// Buy Subscription
router.post(
  "/buy/:subscriptionId",
  authCheck,
  authorized("user"),
  upload.single("screenshot"),
  createDeposit
);

// Get Payment Settings
router.get("/payment-settings", authCheck, getPaymentSettings);
router.get(
  "/get-ads",
  authCheck,
  getAllAdsOfLoginUser
);

// ---------------------------------------------------------
// COMPLETE / VIEW AD
//
// IMPORTANT:
// Is endpoint mein reward nahi diya jata.
// Sirf viewedAt save hota hai.
// ---------------------------------------------------------

router.post(
  "/complete-ad",
  authCheck,
  completeAd
);


router.get("/get-me", authCheck, getMe);

router.get("/getById/:id", getSubscriptionById);

router.get(
  "/payment-status/:subscriptionId",
  authCheck,
  authorized("user"),
  getPaymentRequestStatus
);

// =========================
// DEPOSIT
// =========================

router.post(
  "/deposit/create",
  authCheck,
  authorized("user"),
  upload.single("receipt"),
  createDeposit
);

//  History 

router.get(
  "/deposit/history",
  authCheck,
  authorized("user"),
  getDepositHistory
);


router.get(
  "/getCurrency",
  authCheck,
  getCurrency,
);
// =========================
// WITHDRAW
// =========================

router.post(
  "/withdrawal/create",
  authCheck,
  authorized("user"),
  createWithdrawal
)

router.get(
  "/withdraw/history",
  authCheck,
  authorized("user"),
);

router.get(
  "/withdrawl/method",
  authCheck,
  authorized("user"),
  getWithdrawalMethods
);

router.get(
  "/withdrawal/history",
  authCheck,
  authorized("user"),
  getWithdrawalHistory
);

router.post(
  "/withdrawal/account",
  authCheck,
  authorized("user"),
  saveWithdrawalAccount
);
router.get(
  "/withdrawal/account/:id",
  authCheck,
  authorized("user"),
  getWithdrawalAccount
);


router.get(
  "/get-support",
  getSupport
);

//  Tutorial Routes


router.get(
  "/tutorial",
  authCheck,
  authorized("user"),
  getTutorials
);


router.get(
  "/get-teams",
  authCheck,
  authorized("user"),
  getTeams
);



router.get(
  "/get-income",
  authCheck,
  authorized("user"),
  getIncome
);


// ============================================================
// USER
// ============================================================

// Check selected plan
router.post(
  "/check-subscription",
  authCheck,
  authorized("user"),
  checkSubscription
);


// Balance payment
router.post(
  "/balance-request",
   authCheck,
  authorized("user"),
  createBalanceRequest
);


// Pay Now
router.post(
  "/payment-request",
  authCheck,
  authorized("user"),
  createPaymentRequest
);


// User request history
router.get(
  "/my-requests",
   authCheck,
  authorized("user"),
  getMyRequests
);


// ========================= // SITE SETTINGS // =========================
router.get("/site-settings", getSiteSettings);

export default router;
