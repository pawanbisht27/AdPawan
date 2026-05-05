const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    estimatedReach: {
      type: Number,
      default: 0,
    },
    resultLabel: {
      type: String,
      default: "Leads",
    },
    resultValue: {
      type: Number,
      default: 0,
    },
    platforms: {
      type: [String],
      default: ["Facebook"],
    },
    recommended: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);