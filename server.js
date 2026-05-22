require("dotenv").config();
require("./cron/weeklyReport");

const express = require("express");
const cors    = require("cors");

const connectDB              = require("./config/db");
const authRoutes             = require("./routes/authRoutes");
const businessRoutes         = require("./routes/businessRoutes");
const adRoutes               = require("./routes/adRoutes");
const campaignRoutes         = require("./routes/campaignRoutes");
const leadRoutes             = require("./routes/leadRoutes");
const paymentRoutes          = require("./routes/paymentRoutes");
const designPurchaseRoutes   = require("./routes/designPurchaseRoutes");
const metaRoutes             = require("./routes/metaRoutes");
const metaAdsRoutes          = require("./routes/metaAdsRoutes");
const googleRoutes           = require("./routes/googleRoutes");

// DB connect
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────
app.use("/api/auth",             authRoutes);
app.use("/api/business",         businessRoutes);
app.use("/api/ads",              adRoutes);
app.use("/api/campaigns",        campaignRoutes);
app.use("/api/leads",            leadRoutes);
app.use("/api/payments",         paymentRoutes);
app.use("/api/designs",          require("./routes/designRoutes"));
app.use("/api/packages",         require("./routes/packageRoutes"));
app.use("/api/app-config",       require("./routes/appConfigRoutes"));
app.use("/api/admin",            require("./routes/adminRoutes"));
app.use("/api/admin/dashboard",  require("./routes/adminDashboardRoutes"));
app.use("/api/design-purchase",  designPurchaseRoutes);
app.use("/api/meta",             metaRoutes);
app.use("/api/meta-ads",         metaAdsRoutes); 
app.use("/api/test",             require("./routes/testRoutes"));
app.use("/uploads",              express.static("uploads"));
app.use("/api/google",           googleRoutes);
app.use("/api/notifications",    require("./routes/notificationRoutes"));


// Test route
app.get("/", (req, res) => res.send("API Running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 