const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      default: "Meerut",
      trim: true,
    },
    state: {
      type: String,
      default: "Uttar Pradesh",
      trim: true,
    },

    logo: {
      type: String,
      default: "",
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },
    instagram: {
      type: String,
      default: "",
      trim: true,
    },
    facebook: {
      type: String,
      default: "",
      trim: true,
    },
    linkedin: {
      type: String,
      default: "",
      trim: true,
    },

    currentPlan: {
      type: String,
      default: "Starter",
      trim: true,
    },
    monthlySpend: {
      type: String,
      default: "₹0",
      trim: true,
    },
    totalCampaigns: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      default: "Owner",
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tagLine: {
  type: String,
  default: "",
  trim: true,
},
contactNumber: {
  type: String,
  default: "",
  trim: true,
},
address: {
  type: String,
  default: "",
  trim: true,
},
description: {
  type: String,
  default: "",
  trim: true,
},
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Business", businessSchema);