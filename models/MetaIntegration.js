const mongoose = require("mongoose");

const metaIntegrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
    },

    accessToken: {
      type: String,
      default: "",
    },
    tokenType: {
      type: String,
      default: "",
    },
    expiresIn: {
      type: Number,
      default: 0,
    },

    metaUserId: {
      type: String,
      default: "",
    },
    metaName: {
      type: String,
      default: "",
    },

    pages: {
      type: Array,
      default: [],
    },
    adAccounts: {
      type: Array,
      default: [],
    },

    selectedPageId: {
      type: String,
      default: "",
    },
    selectedPageName: {
      type: String,
      default: "",
    },
    selectedInstagramId: {
      type: String,
      default: "",
    },
    selectedAdAccountId: {
      type: String,
      default: "",
    },

    isConnected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

metaIntegrationSchema.index({ user: 1 }, { unique: true });

module.exports = mongoose.model("MetaIntegration", metaIntegrationSchema);