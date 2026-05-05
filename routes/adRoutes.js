const express = require("express");
const router = express.Router();

const {
  createAd,
  getAds,
  likeAd,
  getAdsByCampaign,
} = require("../controllers/adController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", getAds);
router.get("/campaign/:campaignId", getAdsByCampaign);
router.post("/", authMiddleware, upload.single("image"), createAd);
router.post("/:id/like", authMiddleware, likeAd);

module.exports = router;