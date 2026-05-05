const express = require("express");
const router = express.Router();

const {
  createLead,
  getMyLeads,
  getLeadsByCampaign,
  updateLeadStatus,
  deleteLead,
} = require("../controllers/leadController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createLead);
router.get("/", authMiddleware, getMyLeads);
router.get("/campaign/:campaignId", authMiddleware, getLeadsByCampaign);
router.patch("/:id", authMiddleware, updateLeadStatus);
router.delete("/:id", authMiddleware, deleteLead);

module.exports = router;