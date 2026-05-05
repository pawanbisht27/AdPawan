const express = require("express");
const router = express.Router();

const {
  getConfig,
  updateConfig,
} = require("../controllers/appConfigController");

const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", getConfig);
router.put("/", adminMiddleware, updateConfig);

module.exports = router;