const AppConfig = require("../models/AppConfig");

exports.getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne()
      .populate("featuredPackage")
      .populate("featuredDesign");

    if (!config) {
      config = await AppConfig.create({});
    }

    return res.status(200).json(config);
  } catch (error) {
    console.error("GET CONFIG ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();

    if (!config) {
      config = await AppConfig.create({});
    }

    const {
      bannerText,
      isOfferActive,
      saleTag,
      featuredPackage,
      featuredDesign,
      helpPhone,
      helpYoutubeUrl,
      websiteUrl,
      supportWhatsapp,
      supportEmail,
      growTitle,
      growSubtitle,
      primaryColor,
    } = req.body;

    if (bannerText !== undefined) config.bannerText = bannerText;
    if (isOfferActive !== undefined) config.isOfferActive = isOfferActive;
    if (saleTag !== undefined) config.saleTag = saleTag;
    if (featuredPackage !== undefined) config.featuredPackage = featuredPackage || null;
    if (featuredDesign !== undefined) config.featuredDesign = featuredDesign || null;
    if (helpPhone !== undefined) config.helpPhone = helpPhone;
    if (helpYoutubeUrl !== undefined) config.helpYoutubeUrl = helpYoutubeUrl;
    if (websiteUrl !== undefined) config.websiteUrl = websiteUrl;
    if (supportWhatsapp !== undefined) config.supportWhatsapp = supportWhatsapp;
    if (supportEmail !== undefined) config.supportEmail = supportEmail;
    if (growTitle !== undefined) config.growTitle = growTitle;
    if (growSubtitle !== undefined) config.growSubtitle = growSubtitle;
    if (primaryColor !== undefined) config.primaryColor = primaryColor;

    await config.save();

    return res.status(200).json({
      message: "Config updated successfully",
      config,
    });
  } catch (error) {
    console.error("UPDATE CONFIG ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};