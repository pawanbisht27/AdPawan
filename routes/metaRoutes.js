// routes/metaRoutes.js
// PURANI FILE KO IS SE REPLACE KARO

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getMetaAuthUrl,
  metaCallback,
  getMetaStatus,
  saveSelectedAssets,
  disconnectMeta,
} = require("../controllers/metaController");

router.get("/auth-url",    authMiddleware, getMetaAuthUrl);
router.get("/callback",    metaCallback);
router.get("/status",      authMiddleware, getMetaStatus);
router.post("/save-assets",authMiddleware, saveSelectedAssets);
router.post("/disconnect", authMiddleware, disconnectMeta);

module.exports = router;