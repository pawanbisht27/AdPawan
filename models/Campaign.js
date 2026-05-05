const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    totalBudget: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "draft",
        "payment_pending",
        "paid",
        "active",
        "paused",
        "ended",
        "publish_failed",
      ],
      default: "draft",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);