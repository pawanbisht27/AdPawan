const express = require("express");
const router = express.Router();

const { getDashboardStats } = require("../controllers/adminDashboardController");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/stats", adminMiddleware, getDashboardStats);

module.exports = router;