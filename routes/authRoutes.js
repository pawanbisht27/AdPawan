const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifySignupOtp,
  resendSignupOtp,
  loginUser,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  googleLogin,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/verify-signup-otp", verifySignupOtp);
router.post("/resend-signup-otp", resendSignupOtp);
router.post("/google-login", googleLogin);
module.exports = router;