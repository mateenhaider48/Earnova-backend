import express from "express";
import multer from "multer";

// =========================================================
// SUBSCRIPTION CONTROLLER
// =========================================================

import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscription.controller";

// =========================================================
// ADS CONTROLLER
// =========================================================

import {
  createAd,
  getAllAds,
  getAdById,
  updateAd,
  toggleAdStatus,
  deleteAd,
} from "../controllers/ads.controller";

// =========================================================
// PAYMENT CONTROLLER
// =========================================================

import {
  getDepositHistory,
  getPaymentRequestStatus,
  getPendingDeposits,
  deletePaymentSetting,
  updatePaymentSetting,
  createPaymentSetting,
  getPaymentSettings,
  approveDeposit,
  rejectDeposit,
  getAdminDepositRequests,
  updateDepositStatus,
} from "../controllers/payment.controller";

// =========================================================
// WALLET REQUEST CONTROLLER
// =========================================================

import {
  getAllWalletRequests,
  approveWalletRequest,
  rejectWalletRequest,
} from "../controllers/adminWalletRequests.controller";

// =========================================================
// AUTH
// =========================================================

import authCheck, { authorized } from "../middleware/authCheck.middleware";

import { getAllUsers } from "../controllers/auth.controller";

// =========================================================
// SITE SETTINGS
// =========================================================

import {
  getSiteSettings,
  updateSiteSettings,
} from "../controllers/siteSettings.controller";

// =========================================================
// MULTER
// =========================================================

const upload = multer({
  storage: multer.memoryStorage(),
});

const router = express.Router();

// =========================================================
// ADMIN ROUTES
// =========================================================

// =========================================================
// SUBSCRIPTION
// =========================================================

// Create Subscription
router.post(
  "/create-subscriptions",
  authCheck,
  authorized("admin"),
  upload.fields([
    {
      name: "planImage",
      maxCount: 1,
    },
    {
      name: "activePlanImage",
      maxCount: 1,
    },
  ]),
  createSubscription,
);
// Update Subscription
router.put(
  "/update-subscription/:id",
  authCheck,
  authorized("admin"),
   upload.fields([
    {
      name: "planImage",
      maxCount: 1,
    },
    {
      name: "activePlanImage",
      maxCount: 1,
    },
  ]),
  updateSubscription,
);

// Delete Subscription
router.delete(
  "/delete-subscription/:id",
  authCheck,
  authorized("admin"),
  deleteSubscription,
);

// =========================================================
// OLD PAYMENT REQUESTS
// =========================================================

// Get All Pending Payment Requests
router.get(
  "/pending-payments",
  authCheck,
  authorized("admin"),
  getPendingDeposits,
);

// Approve Payment
router.patch(
  "/approve-payment/:id",
  authCheck,
  authorized("admin"),
  approveDeposit,
);

// Reject Payment
router.patch(
  "/reject-payment/:id",
  authCheck,
  authorized("admin"),
  rejectDeposit,
);

// =========================================================
// WALLET REQUESTS
// =========================================================

// Get ALL Wallet Requests
router.get(
  "/wallet-requests",
  authCheck,
  authorized("admin"),
  getAllWalletRequests,
);

// Approve Wallet Request
router.patch(
  "/wallet-requests/:id/approve",
  authCheck,
  authorized("admin"),
  approveWalletRequest,
);

// Reject Wallet Request
router.patch(
  "/wallet-requests/:id/reject",
  authCheck,
  authorized("admin"),
  rejectWalletRequest,
);

// =========================================================
// PAYMENT SETTINGS
// =========================================================

// Get All Payment Settings
router.get(
  "/payment-settings",
  authCheck,
  authorized("admin"),
  getPaymentSettings,
);


router.post(
  "/payment-settings",
  authCheck,
  authorized("admin"),
  upload.fields([
    {
      name: "paymentImage",
      maxCount: 1,
    },
    {
      name: "paymentQRCode",
      maxCount: 1,
    },
  ]),
  createPaymentSetting,
);

// Update Payment Setting
router.put(
  "/payment-settings/:id",
  authCheck,
  authorized("admin"),
  upload.fields([
    {
      name: "paymentImage",
      maxCount: 1,
    },
    {
      name: "paymentQRCode",
      maxCount: 1,
    },
  ]),
  updatePaymentSetting,
);

// Delete Payment Setting
router.delete(
  "/payment-settings/:id",
  authCheck,
  authorized("admin"),
  deletePaymentSetting,
);

router.post(
  "/create-ads",
  authCheck,
  authorized("admin"),
  upload.single("media"),
  createAd
);

// ---------------------------------------------------------
// GET ALL ADS
// ---------------------------------------------------------

router.get(
  "/get-ads",
  authCheck,
  authorized("admin"),
  getAllAds
);

// ---------------------------------------------------------
// GET SINGLE AD
// ---------------------------------------------------------

router.get(
  "/getById/:id",
  authCheck,
  authorized("admin"),
  getAdById
);

// ---------------------------------------------------------
// UPDATE AD
//
// No subscription / plan required.
// ---------------------------------------------------------

router.put(
  "/update-ad/:id",
  authCheck,
  authorized("admin"),
  upload.single("media"),
  updateAd
);

// ---------------------------------------------------------
// TOGGLE AD
// ---------------------------------------------------------

router.patch(
  "/toggle-ad/:id",
  authCheck,

  authorized("admin"),
  toggleAdStatus
);

// ---------------------------------------------------------
// DELETE AD
// ---------------------------------------------------------

router.delete(
  "/delete-ad/:id",
  authCheck,
  authorized("admin"),
  deleteAd
);



// =========================================================
// USERS
// =========================================================

// Get All Users
router.get("/get-all-user", authCheck, authorized("admin"), getAllUsers);

// Get User By ID
router.get("/getUserById/:id", authCheck, authorized("admin"), getAllUsers);

// =========================================================
// PUBLIC ROUTES
// =========================================================

// Get All Subscription Plans
router.get("/get-all-subscription", getAllSubscriptions);

// Get Single Subscription Plan
router.get("/getById/:id", authCheck, authorized("user"), getSubscriptionById);

// =========================================================
// SITE SETTINGS
// =========================================================

// Get Site Settings
router.get("/site-settings", authCheck, authorized("admin"), getSiteSettings);

// Update Site Settings
router.put(
  "/site-settings",
  authCheck,
  authorized("admin"),
  updateSiteSettings,
);

// =========================================================
// CURRENCY CONTROLLER
// =========================================================

import {
  getCurrency,
  updateCurrency,
} from "../controllers/currency.controller";
import {
  createWithdrawal,
  createWithdrawalMethod,
  getAdminWithdrawalRequests,
  updateWithdrawalStatus,
} from "../controllers/withdrawl.controller";
import { getSupport, updateSupport } from "../controllers/support.controller";
import { createCompanyAd, createIncome, createTutorial, deleteCompanyAd, deleteTutorial, getCompanyAds, getIncome, getTutorialById, getTutorials, updateTutorial } from "../controllers/tutorial.controller";
import { approveRequest, getAllRequests, getSingleRequest, rejectRequest } from "../controllers/subscriptionRequest.controller";

// Get Current Currency
router.get("/getCurrency", authCheck, authorized("admin"), getCurrency);

// Update Currency
router.patch(
  "/update-currency",
  authCheck,
  authorized("admin"),
  updateCurrency,
);

router.post(
  "/withdrawl/method",
  authCheck,
  authorized("admin"),
  upload.fields([
    {
      name: "paymentImage",
      maxCount: 1,
    },
  ]),
  createWithdrawalMethod,
);

router.get(
  "/deposits/requests",
  authCheck,
  authorized("admin"),
  getAdminDepositRequests,
);

router.patch(
  "/deposits/:id/status",
  authCheck,
  authorized("admin"),
  updateDepositStatus,
);

router.patch(
  "/withdrawals/:id/status",
  authCheck,
  authorized("admin"),
  updateWithdrawalStatus,
);

router.get(
  "/withdrawals/requests",
  authCheck,
  authorized("admin"),
  getAdminWithdrawalRequests,
);


router.put(
  "/update-support",
  authCheck,
  authorized("admin"),
  updateSupport
);

router.get(
  "/get-support",
  authCheck,
  authorized("admin"),
  getSupport
);


/*
============================================================
Tutorial ROUTES
============================================================
*/

// Admin create
router.post(
  "/create-tutorial",
  authCheck,
  authorized("admin"),
  upload.single("media"),
  createTutorial
);

// User/Admin get all
router.get(
  "/get-all-tutorials",
  authCheck,
  authorized("admin"),
  getTutorials
);

// Get single
router.get(
  "/getTutorial/:id",
  authCheck,
  authorized("admin"),
  getTutorialById
);

// Admin update
router.put(
  "/updateTutorial/:id",
  authCheck,
  authorized("admin"),
  upload.single("media"),
  updateTutorial
);

// Admin delete
router.delete(
  "/deleteTutorial/:id",
  authCheck,
  authorized("admin"),
  deleteTutorial
);

router.post(
  "/create-income",
  authCheck,
  authorized("admin"),
  upload.single("image"),
  createIncome
);

router.get(
  "/get-income",
   authCheck,
  authorized("admin"),
  getIncome
);

router.post(
  "/create-companyAd",
  authCheck,
  authorized("admin"),
  upload.single("image"),
  createCompanyAd
);

router.get(
  "/get-companyAd",
   authCheck,
  authorized("admin"),
  getCompanyAds
);

router.delete(
  "/delete-companyAd/:id",
  authCheck,
  authorized("admin"),
  deleteCompanyAd
);


// ============================================================
// ADMIN
// ============================================================

// All requests
router.get(
  "/requests",
  authCheck,
  authorized("admin"),
  getAllRequests
);


// Single request
router.get(
  "/requests/:id",
    authCheck,
  authorized("admin"),
  getSingleRequest
);


// Approve
router.patch(
  "requests/:id/approve",
   authCheck,
  authorized("admin"),
  approveRequest
);


// Reject
router.patch(
  "/requests/:id/reject",
   authCheck,
  authorized("admin"),
  rejectRequest
);



export default router;
