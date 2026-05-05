const crypto = require("crypto");
const Razorpay = require("razorpay");
const Design = require("../models/Design");
const DesignPurchase = require("../models/DesignPurchase");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createDesignOrder = async (req, res) => {
  try {
    const { designId } = req.body;

    if (!designId) {
      return res.status(400).json({ message: "designId is required" });
    }

    const design = await Design.findById(designId);

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    if (design.status !== "approved" || design.isActive !== true) {
      return res.status(400).json({ message: "Design is not available" });
    }

    if ((design.price || 0) <= 0) {
      return res.status(400).json({ message: "This design is free" });
    }

    const alreadyPurchased = await DesignPurchase.findOne({
      user: req.user,
      design: design._id,
      paymentStatus: "paid",
    });

    if (alreadyPurchased) {
      return res.status(200).json({
        message: "Design already purchased",
        alreadyPurchased: true,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(design.price) * 100),
      currency: "INR",
      receipt: `d_${String(design._id).slice(-8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        type: "design_purchase",
        designId: design._id.toString(),
        userId: req.user.toString(),
      },
    });

    const purchase = await DesignPurchase.create({
      user: req.user,
      design: design._id,
      amount: Number(design.price),
      paymentStatus: "created",
      razorpayOrderId: order.id,
    });

    return res.status(201).json({
      message: "Design order created successfully",
      order,
      purchase,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      design: {
        _id: design._id,
        title: design.title,
        price: design.price,
      },
    });
  } catch (error) {
    console.error("CREATE DESIGN ORDER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.verifyDesignPayment = async (req, res) => {
  try {
    const {
      purchaseId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !purchaseId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Missing payment verification fields",
      });
    }

    const purchase = await DesignPurchase.findOne({
      _id: purchaseId,
      user: req.user,
    });

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      purchase.paymentStatus = "failed";
      purchase.razorpayPaymentId = razorpay_payment_id;
      purchase.razorpaySignature = razorpay_signature;
      await purchase.save();

      return res.status(400).json({ message: "Invalid payment signature" });
    }

    purchase.paymentStatus = "paid";
    purchase.razorpayPaymentId = razorpay_payment_id;
    purchase.razorpaySignature = razorpay_signature;
    purchase.transactionId = razorpay_payment_id;
    purchase.paidAt = new Date();
    await purchase.save();

    return res.json({
      message: "Design payment verified successfully",
      purchase,
    });
  } catch (error) {
    console.error("VERIFY DESIGN PAYMENT ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.checkDesignPurchased = async (req, res) => {
  try {
    const { designId } = req.params;

    const purchase = await DesignPurchase.findOne({
      user: req.user,
      design: designId,
      paymentStatus: "paid",
    });

    return res.status(200).json({
      purchased: !!purchase,
      purchase: purchase || null,
    });
  } catch (error) {
    console.error("CHECK DESIGN PURCHASE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};