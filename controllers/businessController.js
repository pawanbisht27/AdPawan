const Business = require("../models/Business");

exports.createBusiness = async (req, res) => {
  try {
    const {
      businessName,
      category,
      city,
      state,
      tagLine,
      contactNumber,
      address,
      description,
      website,
      instagram,
      facebook,
      linkedin,
    } = req.body;

    if (!businessName || !category) {
      return res.status(400).json({
        message: "businessName and category are required",
      });
    }

    let business = await Business.findOne({ user: req.user });

    if (business) {
      business.businessName = businessName.trim();
      business.category = category.trim();
      if (city !== undefined) business.city = city.trim();
      if (state !== undefined) business.state = state.trim();
      if (tagLine !== undefined) business.tagLine = tagLine.trim();
      if (contactNumber !== undefined) business.contactNumber = contactNumber.trim();
      if (address !== undefined) business.address = address.trim();
      if (description !== undefined) business.description = description.trim();
      if (website !== undefined) business.website = website.trim();
      if (instagram !== undefined) business.instagram = instagram.trim();
      if (facebook !== undefined) business.facebook = facebook.trim();
      if (linkedin !== undefined) business.linkedin = linkedin.trim();

      await business.save();

      return res.status(200).json({
        message: "Business already existed, updated successfully",
        business,
      });
    }

    business = await Business.create({
      user: req.user,
      businessName: businessName.trim(),
      category: category.trim(),
      city: city?.trim() || "Meerut",
      state: state?.trim() || "Uttar Pradesh",
      tagLine: tagLine?.trim() || "",
      contactNumber: contactNumber?.trim() || "",
      address: address?.trim() || "",
      description: description?.trim() || "",
      website: website?.trim() || "",
      instagram: instagram?.trim() || "",
      facebook: facebook?.trim() || "",
      linkedin: linkedin?.trim() || "",
    });

    return res.status(201).json({
      message: "Business created",
      business,
    });
  } catch (error) {
    console.error("CREATE BUSINESS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ user: req.user });

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    return res.status(200).json({ business });
  } catch (error) {
    console.error("GET BUSINESS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const {
      businessName,
      category,
      city,
      state,
      logo,
      website,
      instagram,
      facebook,
      linkedin,
      currentPlan,
      monthlySpend,
      totalCampaigns,
      role,
      isVerified,
      tagLine,
      contactNumber,
      address,
      description,  
    } = req.body;

    const updateData = {};

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (logo !== undefined) updateData.logo = logo.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (instagram !== undefined) updateData.instagram = instagram.trim();
    if (facebook !== undefined) updateData.facebook = facebook.trim();
    if (linkedin !== undefined) updateData.linkedin = linkedin.trim();
    if (currentPlan !== undefined) updateData.currentPlan = currentPlan.trim();
    if (monthlySpend !== undefined) updateData.monthlySpend = monthlySpend.trim();
    if (totalCampaigns !== undefined)
      updateData.totalCampaigns = Number(totalCampaigns) || 0;
    if (role !== undefined) updateData.role = role.trim();
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (tagLine !== undefined) updateData.tagLine = tagLine.trim();
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (description !== undefined) updateData.description = description.trim();

    const business = await Business.findOneAndUpdate(
      { user: req.user },
      updateData,
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    return res.json({
      message: "Business updated successfully",
      business,
    });
  } catch (error) {
    console.error("UPDATE BUSINESS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};