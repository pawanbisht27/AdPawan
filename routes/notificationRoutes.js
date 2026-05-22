const express = require("express");

const router = express.Router();

const {
  saveFcmToken,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/save-token",
  authMiddleware,
  saveFcmToken
);

module.exports = router;