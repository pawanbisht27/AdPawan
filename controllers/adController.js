const Ad = require("../models/Ad");

exports.createAd = async (req, res) => {
  try {
    const { title, description, businessId, campaignId } = req.body;

    const image = req.file ? req.file.filename : null;

    const ad = await Ad.create({
      user: req.user,
      business: businessId,
      campaign: campaignId,
      title,
      description,
      image,
    });

    res.status(201).json({
      message: "Ad created",
      ad,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAds = async (req, res) => {
  try {
    const ads = await Ad.find()
      .populate("user", "name email")
      .populate("business", "businessName category")
      .populate("campaign", "name status")
      .sort({ createdAt: -1 });

    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.likeAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    const alreadyLiked = ad.likes.some(
      (userId) => userId.toString() === req.user
    );

    if (alreadyLiked) {
      ad.likes = ad.likes.filter(
        (userId) => userId.toString() !== req.user
      );
    } else {
      ad.likes.push(req.user);
    }

    await ad.save();

    res.json({
      message: alreadyLiked ? "Ad unliked" : "Ad liked",
      likesCount: ad.likes.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAdsByCampaign = async (req, res) => {
  try {
    const ads = await Ad.find({ campaign: req.params.campaignId })
      .sort({ createdAt: -1 });

    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};