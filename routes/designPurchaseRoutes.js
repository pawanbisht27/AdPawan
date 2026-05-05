const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createDesignOrder,
  verifyDesignPayment,
  checkDesignPurchased,
} = require("../controllers/designPurchaseController");

router.post("/create-order", authMiddleware, createDesignOrder);
router.post("/verify", authMiddleware, verifyDesignPayment);
router.get("/check/:designId", authMiddleware, checkDesignPurchased);

module.exports = router;