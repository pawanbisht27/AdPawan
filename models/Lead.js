const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
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
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ad",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: "Manual",
    },
    status: {
      type: String,
      enum: ["new", "interested", "pending", "visited", "closed"],
      default: "new",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);