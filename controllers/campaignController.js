const mongoose = require("mongoose");
const Campaign = require("../models/Campaign");
const Business = require("../models/Business");
const admin = require("../config/firebase");

const {
  createDemoLeadsForCampaign,
} = require("./leadController");

exports.createCampaign = async (req, res) => {
  try {
    const {
      businessId,
      name,
      description,
      totalBudget,
      startDate,
      endDate,
    } = req.body;

    if (
      !businessId ||
      !name ||
      !totalBudget ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "businessId, name, totalBudget, startDate and endDate are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return res.status(400).json({
        message: "Invalid businessId",
      });
    }

    const business = await Business.findOne({
      _id: businessId,
      user: req.user,
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found for this user",
      });
    }

    const parsedBudget = Number(totalBudget);

    if (
      Number.isNaN(parsedBudget) ||
      parsedBudget <= 0
    ) {
      return res.status(400).json({
        message: "Invalid totalBudget",
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid startDate or endDate",
      });
    }

    if (parsedEndDate < parsedStartDate) {
      return res.status(400).json({
        message:
          "End date must be after start date",
      });
    }

    const campaign = await Campaign.create({
      user: req.user,
      business: businessId,
      name: name.trim(),
      description:
        description?.trim() || "",
      totalBudget: parsedBudget,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status: "draft",
    });

    await createDemoLeadsForCampaign({
      userId: req.user,
      businessId: businessId,
      campaignId: campaign._id,
      campaignName: campaign.name,
    });

    // 🔥 Send Notification
    if (
      business?.fcmToken &&
      business?.campaignAlerts
    ) {
      await admin.messaging().send({
        token: business.fcmToken,

        notification: {
          title: "Campaign Created",
          body:
            "Your campaign was created successfully",
        },

        data: {
          type: "campaign_created",
          campaignId:
            campaign._id.toString(),
        },
      });
    }

    return res.status(201).json({
      message: "Campaign created successfully",
      campaign,
    });
  } catch (error) {
    console.error(
      "CREATE CAMPAIGN ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.getMyCampaigns = async (req, res) => {
  try {
    const { businessId } = req.query;

    const filter = {
      user: req.user,
    };

    if (businessId) {
      filter.business = businessId;
    }

    const campaigns = await Campaign.find(filter)
      .populate(
        "business",
        "businessName category"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(campaigns);
  } catch (error) {
    console.error(
      "GET CAMPAIGNS ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.updateCampaignStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (
      ![
        "draft",
        "active",
        "paused",
        "ended",
        "payment_pending",
      ].includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid campaign status",
      });
    }

    const campaign =
      await Campaign.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user,
        },
        { status },
        { new: true }
      ).populate("business");

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    // 🔥 Status Notification
    if (
      campaign.business?.fcmToken &&
      campaign.business?.campaignAlerts
    ) {
      await admin.messaging().send({
        token:
          campaign.business.fcmToken,

        notification: {
          title: "Campaign Updated",
          body: `Campaign status changed to ${status}`,
        },

        data: {
          type: "campaign_status",
          campaignId:
            campaign._id.toString(),
        },
      });
    }

    return res.json({
      message:
        "Campaign status updated successfully",
      campaign,
    });
  } catch (error) {
    console.error(
      "UPDATE CAMPAIGN STATUS ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.deleteCampaign = async (
  req,
  res
) => {
  try {
    const campaign =
      await Campaign.findOneAndDelete({
        _id: req.params.id,
        user: req.user,
      });

    if (!campaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    return res.json({
      message: "Campaign deleted",
    });
  } catch (error) {
    console.error(
      "DELETE CAMPAIGN ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.updateCampaign = async (
  req,
  res
) => {
  try {
    const {
      name,
      description,
      totalBudget,
      startDate,
      endDate,
    } = req.body;

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description =
        description.trim();
    }

    if (totalBudget !== undefined) {
      const parsedBudget =
        Number(totalBudget);

      if (
        Number.isNaN(parsedBudget) ||
        parsedBudget <= 0
      ) {
        return res.status(400).json({
          message: "Invalid totalBudget",
        });
      }

      updateData.totalBudget =
        parsedBudget;
    }

    if (startDate !== undefined) {
      const parsedStartDate =
        new Date(startDate);

      if (
        Number.isNaN(
          parsedStartDate.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid startDate",
        });
      }

      updateData.startDate =
        parsedStartDate;
    }

    if (endDate !== undefined) {
      const parsedEndDate =
        new Date(endDate);

      if (
        Number.isNaN(
          parsedEndDate.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid endDate",
        });
      }

      updateData.endDate =
        parsedEndDate;
    }

    const existingCampaign =
      await Campaign.findOne({
        _id: req.params.id,
        user: req.user,
      });

    if (!existingCampaign) {
      return res.status(404).json({
        message: "Campaign not found",
      });
    }

    const finalStartDate =
      updateData.startDate ||
      existingCampaign.startDate;

    const finalEndDate =
      updateData.endDate ||
      existingCampaign.endDate;

    if (finalEndDate < finalStartDate) {
      return res.status(400).json({
        message:
          "End date must be after start date",
      });
    }

    const campaign =
      await Campaign.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user,
        },
        updateData,
        { new: true }
      );

    return res.json({
      message:
        "Campaign updated successfully",
      campaign,
    });
  } catch (error) {
    console.error(
      "UPDATE CAMPAIGN ERROR:",
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};