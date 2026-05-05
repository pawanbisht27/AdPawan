const express = require("express");
const router = express.Router();

const {
  createCampaign,
  getMyCampaigns,
  updateCampaignStatus,
  deleteCampaign,
  updateCampaign,
} = require("../controllers/campaignController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createCampaign);
router.get("/", authMiddleware, getMyCampaigns);
router.patch("/:id/status", authMiddleware, updateCampaignStatus);
router.delete("/:id", authMiddleware, deleteCampaign);
router.put("/:id", authMiddleware, updateCampaign);

module.exports = router;