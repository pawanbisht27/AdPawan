const express = require("express");
const router = express.Router();

const {
  createBusiness,
  getMyBusiness,
  updateBusiness,
} = require("../controllers/businessController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/setup", authMiddleware, createBusiness);
router.get("/me", authMiddleware, getMyBusiness);
router.patch("/update", authMiddleware, updateBusiness);

module.exports = router;