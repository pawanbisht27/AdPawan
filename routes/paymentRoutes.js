const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getMyPayments,
} = require("../controllers/paymentController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/create-order", authMiddleware, createPaymentOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.get("/", authMiddleware, getMyPayments);

module.exports = router;