const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Business = require("../models/Business");
const Campaign = require("../models/Campaign");
const Ad = require("../models/Ad");

exports.createLead = async (req, res) => {
  try {
    const {
      businessId,
      campaignId,
      adId,
      name,
      phone,
      source,
      status,
      notes,
    } = req.body;

    if (!businessId || !campaignId || !name || !phone) {
      return res.status(400).json({
        message: "businessId, campaignId, name and phone are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({ message: "Invalid businessId" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaignId" });
    }

    if (adId && !mongoose.Types.ObjectId.isValid(adId)) {
      return res.status(400).json({ message: "Invalid adId" });
    }

    const business = await Business.findOne({
      _id: businessId,
      user: req.user,
    });

    if (!business) {
      return res.status(404).json({ message: "Business not found for this user" });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      user: req.user,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found for this user" });
    }

    if (String(campaign.business) !== String(businessId)) {
      return res.status(400).json({
        message: "Campaign does not belong to this business",
      });
    }

    if (adId) {
      const ad = await Ad.findOne({
        _id: adId,
        user: req.user,
      });

      if (!ad) {
        return res.status(404).json({ message: "Ad not found for this user" });
      }
    }

    const lead = await Lead.create({
      user: req.user,
      business: businessId,
      campaign: campaignId,
      ad: adId || null,
      name: name.trim(),
      phone: phone.trim(),
      source: source?.trim() || "Manual",
      status: status || "new",
      notes: notes?.trim() || "",
    });

    return res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getMyLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ user: req.user })
      .populate("business", "businessName category")
      .populate("campaign", "name status")
      .populate("ad", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json(leads);
  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getLeadsByCampaign = async (req, res) => {
  try {
    const leads = await Lead.find({
      user: req.user,
      campaign: req.params.campaignId,
    })
      .populate("campaign", "name")
      .populate("ad", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json(leads);
  } catch (error) {
    console.error("GET LEADS BY CAMPAIGN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      updateData,
      { new: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    console.error("UPDATE LEAD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

const createDemoLeadsForCampaign = async ({
  userId,
  businessId,
  campaignId,
  campaignName,
}) => {
  const lowerName = (campaignName || "").toLowerCase();

  let demoLeads = [];

  if (lowerName.includes("whatsapp")) {
    demoLeads = [
      {
        name: "Rahul Sharma",
        phone: "919876543210",
        source: "WhatsApp",
        status: "new",
        notes: "Interested in product details",
      },
      {
        name: "Priya Verma",
        phone: "919812345678",
        source: "WhatsApp",
        status: "interested",
        notes: "Asked price on WhatsApp",
      },
    ];
  } else if (lowerName.includes("call")) {
    demoLeads = [
      {
        name: "Aman Joshi",
        phone: "919900112233",
        source: "Call",
        status: "new",
        notes: "Requested callback",
      },
      {
        name: "Neha Rawat",
        phone: "919811223344",
        source: "Call",
        status: "visited",
        notes: "Call completed successfully",
      },
    ];
  } else if (lowerName.includes("website")) {
    demoLeads = [
      {
        name: "Sanya Kapoor",
        phone: "919955667788",
        source: "Website",
        status: "new",
        notes: "Submitted website inquiry form",
      },
      {
        name: "Karan Singh",
        phone: "919844556677",
        source: "Website",
        status: "pending",
        notes: "Requested more details from landing page",
      },
    ];
  } else if (lowerName.includes("app")) {
    demoLeads = [
      {
        name: "Rohit Mehra",
        phone: "919877665544",
        source: "Google",
        status: "new",
        notes: "Interested after app install ad",
      },
    ];
  } else {
    demoLeads = [
      {
        name: "Demo Lead 1",
        phone: "919898101907",
        source: "Added",
        status: "new",
        notes: "Lead generated from Facebook campaign",
      },
      {
        name: "Demo Lead 2",
        phone: "919898101908",
        source: "WhatsApp",
        status: "interested",
        notes: "Asked for pricing details",
      },
      {
        name: "Demo Lead 3",
        phone: "919898101909",
        source: "Sent Offer",
        status: "visited",
        notes: "Offer shared with customer",
      },
    ];
  }

  const leadsToInsert = demoLeads.map((lead) => ({
    user: userId,
    business: businessId,
    campaign: campaignId,
    ad: null,
    name: lead.name,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    notes: lead.notes,
  }));

  await Lead.insertMany(leadsToInsert);
};
exports.createDemoLeadsForCampaign = createDemoLeadsForCampaign;