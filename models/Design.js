const mongoose = require("mongoose");

const designSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    buttonText: {
      type: String,
      default: "CONTACT US",
    },
    phone: {
      type: String,
      default: "+919876543210",
    },
    address: {
      type: String,
      default: "Haldwani, Uttarakhand",
    },
    platform: {
      type: String,
      default: "Facebook",
    },
    templateType: {
      type: String,
      default: "split_banner",
    },

    // 🔥 NEW
    price: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    designSource: {
      type: String,
      enum: ["admin", "designer"],
      default: "admin",
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

module.exports = mongoose.model("Design", designSchema);