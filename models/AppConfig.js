const mongoose = require("mongoose");

const appConfigSchema = new mongoose.Schema(
  {
    bannerText: {
      type: String,
      default: "Grow your business with us 🚀",
    },
    isOfferActive: {
      type: Boolean,
      default: false,
    },
    saleTag: {
      type: String,
      default: "",
    },

    featuredPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    featuredDesign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      default: null,
    },

    helpPhone: {
      type: String,
      default: "+919876543210",
    },
    helpYoutubeUrl: {
      type: String,
      default: "",
    },
    websiteUrl: {
      type: String,
      default: "",
    },
    supportWhatsapp: {
      type: String,
      default: "",
    },
    supportEmail: {
      type: String,
      default: "",
    },

    growTitle: {
      type: String,
      default: "Grow Your Business",
    },
    growSubtitle: {
      type: String,
      default: "Choose the right advertising package to reach more customers and generate quality leads.",
    },

    primaryColor: {
      type: String,
      default: "#A90006",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppConfig", appConfigSchema);