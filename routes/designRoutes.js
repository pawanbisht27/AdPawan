const express = require("express");
const router = express.Router();

const {
  createDesign,
  getDesigns,
  getAllDesignsForAdmin,
  updateDesign,
  deleteDesign,
  toggleDesignStatus,
  updatePriority,

  // NEW
  uploadDesign,
  getPendingDesigns,
  approveDesign,
  rejectDesign,
} = require("../controllers/designController");

const upload = require("../middleware/uploadMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

/// ADMIN OLD
router.post("/", adminMiddleware, upload.single("image"), createDesign);
router.put("/:id", adminMiddleware, upload.single("image"), updateDesign);
router.delete("/:id", adminMiddleware, deleteDesign);
router.patch("/:id/toggle", adminMiddleware, toggleDesignStatus);
router.patch("/:id/priority", adminMiddleware, updatePriority);

/// USER
router.get("/", getDesigns);

/// ADMIN VIEW
router.get("/admin/all", adminMiddleware, getAllDesignsForAdmin);

/// DESIGNER (NEW)
router.post("/upload", authMiddleware, upload.single("image"), uploadDesign);

/// ADMIN APPROVAL (NEW)
router.get("/pending", adminMiddleware, getPendingDesigns);
router.put("/:id/approve", adminMiddleware, approveDesign);
router.put("/:id/reject", adminMiddleware, rejectDesign);

module.exports = router;