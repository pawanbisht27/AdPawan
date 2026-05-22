const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Payment = require("../models/Payment");
const Campaign = require("../models/Campaign");
const Business = require("../models/Business");

const admin = require("../config/firebase"); // 👈 add this

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = async (req, res) => {
  try {
    const { campaignId, amount } = req.body;

    if (!campaignId || amount === undefined || amount === null) {
      return res.status(400).json({
        message: "campaignId and amount are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        message: "Invalid campaignId",
      });
    }

    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        message: "Valid amount is required",
      });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      user: req.user,
    });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    const business = await Business.findOne({
      _id: campaign.business,
      user: req.user,
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(parsedAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        campaignId: campaign._id.toString(),
        userId: req.user.toString(),
      },
    });

    const payment = await Payment.create({
      user: req.user,
      business: business._id,
      campaign: campaign._id,
      amount: parsedAmount,
      paymentStatus: "pending",
      paymentGateway: "razorpay",
      transactionId: razorpayOrder.id,
    });

    campaign.status = "payment_pending";
    await campaign.save();

    // 🔔 payment pending notification
    if (
      business?.fcmToken &&
      business?.paymentAlerts
    ) {
      await admin.messaging().send({
        token: business.fcmToken,

        notification: {
          title: "Payment Started",
          body: `Payment process started for ${campaign.name}`,
        },
      });
    }

    return res.status(201).json({
      message: "Payment order created",
      payment,
      order: razorpayOrder,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE PAYMENT ORDER ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      paymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !paymentId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Missing payment verification fields",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      user: req.user,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // ❌ invalid payment
    if (expectedSignature !== razorpay_signature) {
      payment.paymentStatus = "failed";
      await payment.save();

      const failedCampaign = await Campaign.findOne({
        _id: payment.campaign,
        user: req.user,
      });

      if (failedCampaign) {
        failedCampaign.status = "draft";
        await failedCampaign.save();
      }

      // 🔔 failed notification
      if (
        business?.fcmToken &&
        business?.paymentAlerts
      ) {
        await admin.messaging().send({
          token: business.fcmToken,

          notification: {
            title: "Payment Failed",
            body: "Your payment verification failed",
          },
        });
      }

      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // ✅ payment success
    payment.paymentStatus = "paid";
    payment.transactionId = razorpay_payment_id;
    payment.paidAt = new Date();

    await payment.save();

    const campaign = await Campaign.findOne({
      _id: payment.campaign,
      user: req.user,
    });

    if (campaign) {
      campaign.status = "active";
      await campaign.save();
    }

    // 🔔 success notification
    const business = await Business.findOne({
      _id: payment.business,
      user: req.user,
    });

    if (
      business?.fcmToken &&
      business?.paymentAlerts
    ) {
      await admin.messaging().send({
        token: business.fcmToken,

        notification: {
          title: "Payment Successful",
          body:
            "Your payment was completed successfully",
        },
      });
    }

    return res.json({
      message: "Payment verified successfully",
      payment,
      campaign,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user,
    })
      .populate(
        "campaign",
        "name status totalBudget"
      )
      .populate(
        "business",
        "businessName category"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(payments);
  } catch (error) {
    console.error("GET PAYMENTS ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};