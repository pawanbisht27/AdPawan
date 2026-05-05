const Design = require("../models/Design");
const Package = require("../models/Package");
const Campaign = require("../models/Campaign");
const Payment = require("../models/Payment");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalDesigns = await Design.countDocuments();
    const totalPackages = await Package.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalPayments = await Payment.countDocuments();

    const revenue = await Payment.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      totalDesigns,
      totalPackages,
      totalCampaigns,
      totalPayments,
      revenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};