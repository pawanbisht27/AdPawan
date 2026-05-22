// routes/metaAdsRoutes.js
// YE NAYA FILE HAI — routes/ folder mein daalo

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getCampaigns,
  createCampaign,
  createFullAd,
  getInsights,
  updateAdStatus,
} = require("../controllers/metaAdsController");

router.get("/campaigns",       authMiddleware, getCampaigns);
router.post("/campaigns",      authMiddleware, createCampaign);
router.post("/create-full-ad", authMiddleware, createFullAd);
router.get("/insights",        authMiddleware, getInsights);
router.post("/ad-status",      authMiddleware, updateAdStatus);

module.exports = router;