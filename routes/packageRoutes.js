const express = require("express");
const router = express.Router();

const {
  createPackage,
  getPackages,
  getAllPackages,
  updatePackage,
  deletePackage,
  togglePackage,
} = require("../controllers/packageController");

const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/", adminMiddleware, createPackage);
router.get("/", getPackages);
router.get("/admin/all", adminMiddleware, getAllPackages);
router.put("/:id", adminMiddleware, updatePackage);
router.delete("/:id", adminMiddleware, deletePackage);
router.patch("/:id/toggle", adminMiddleware, togglePackage);

module.exports = router;