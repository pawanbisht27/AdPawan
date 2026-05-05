require("dotenv").config();


const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const adRoutes = require("./routes/adRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const leadRoutes = require("./routes/leadRoutes");
const paymentRoutes = require("./routes/paymentRoutes");  
const designPurchaseRoutes = require("./routes/designPurchaseRoutes");
const metaRoutes = require("./routes/metaRoutes");


// DB connect
connectDB();

const app = express();


app.use(cors());
app.use(express.json());



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/ads", adRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/campaigns", campaignRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/designs", require("./routes/designRoutes"));
app.use("/uploads", express.static("uploads"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use(express.json());
app.use("/api/packages", require("./routes/packageRoutes"));
app.use("/api/app-config", require("./routes/appConfigRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/design-purchase", designPurchaseRoutes);
app.use("/api/meta", metaRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});