const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const googleController = require("../controllers/googleController");

// ─── OAUTH (existing) ─────────────────────────────────────────────────────
router.get("/auth-url",   authMiddleware, googleController.getGoogleAuthUrl);
router.get("/callback",                  googleController.googleCallback);
router.get("/status",     authMiddleware, googleController.getGoogleStatus);
router.get("/verify-ads", authMiddleware, googleController.verifyGoogleAdsAccess);

// ─── ACCOUNT ──────────────────────────────────────────────────────────────
router.get("/overview",   authMiddleware, googleController.getAccountOverview);

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────
router.get("/campaigns",                      authMiddleware, googleController.getCampaigns);
router.post("/campaigns",                     authMiddleware, googleController.createCampaign);
router.put("/campaigns/:campaignId",          authMiddleware, googleController.updateCampaign);
router.put("/campaigns/:campaignId/budget",   authMiddleware, googleController.updateBudget);

// ─── AD GROUPS ────────────────────────────────────────────────────────────
router.get("/campaigns/:campaignId/ad-groups",  authMiddleware, googleController.getAdGroups);
router.post("/campaigns/:campaignId/ad-groups", authMiddleware, googleController.createAdGroup);

// ─── ADS ──────────────────────────────────────────────────────────────────
router.post("/ad-groups/:adGroupId/search-ad",  authMiddleware, googleController.createSearchAd);
router.post("/ad-groups/:adGroupId/display-ad", authMiddleware, googleController.createDisplayAd);
router.post("/campaigns/shopping",              authMiddleware, googleController.createShoppingCampaign);

// ─── KEYWORDS ─────────────────────────────────────────────────────────────
router.get("/ad-groups/:adGroupId/keywords",    authMiddleware, googleController.getKeywords);
router.post("/ad-groups/:adGroupId/keywords",   authMiddleware, googleController.addKeywords);
router.post("/keywords/suggestions",            authMiddleware, googleController.getKeywordSuggestions);

// ─── ANALYTICS ────────────────────────────────────────────────────────────
router.get("/campaigns/:campaignId/analytics",  authMiddleware, googleController.getCampaignAnalytics);

// ─── CONVERSION TRACKING ──────────────────────────────────────────────────
router.get("/conversions",  authMiddleware, googleController.getConversionActions);
router.post("/conversions", authMiddleware, googleController.createConversionAction);

// ─── REMOVAL OF OLD ENDPOINTS ─────────────────────────────────────────────
router.post("/disconnect", authMiddleware, googleController.disconnectGoogle);

module.exports = router;