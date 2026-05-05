const mongoose = require("mongoose");

const designPurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    transactionId: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

designPurchaseSchema.index({ user: 1, design: 1 }, { unique: false });

module.exports = mongoose.model("DesignPurchase", designPurchaseSchema);