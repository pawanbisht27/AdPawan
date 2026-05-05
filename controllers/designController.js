const Design = require("../models/Design");

/// ✅ ADMIN CREATE (OLD SYSTEM SAFE)
exports.createDesign = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      category,
      buttonText,
      phone,
      address,
      platform,
      templateType,
      isActive,
      price
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        message: "title and category are required",
      });
    }

    const design = await Design.create({
      title: title.trim(),
      subtitle: subtitle?.trim() || "",
      category: category.trim(),
      image: req.file ? req.file.filename : "",
      buttonText: buttonText?.trim() || "CONTACT US",
      phone: phone?.trim() || "+919876543210",
      address: address?.trim() || "Haldwani, Uttarakhand",
      platform: platform?.trim() || "Facebook",
      templateType: templateType?.trim() || "split_banner",
      price: Number(price) || 0,
      isActive: isActive !== undefined ? isActive : true,
      status: "approved",
      designSource: "admin",
    });

    return res.status(201).json({
      message: "Design created successfully",
      design,
    });
  } catch (error) {
    console.error("CREATE DESIGN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};


/// 🎨 DESIGNER UPLOAD (NEW)
exports.uploadDesign = async (req, res) => {
  try {
    const { title, category, price } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "title & category required" });
    }

    const design = await Design.create({
      title: title.trim(),
      category: category.trim(),
      price: Number(price) || 0,
      image: req.file ? req.file.filename : "",

      uploadedBy: req.user,

      status: "pending",
      designSource: "designer",
      isActive: false,
    });

    res.json({ message: "Design submitted for approval", design });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/// 👤 USER DESIGNS
exports.getDesigns = async (req, res) => {
  try {
    const designs = await Design.find({
      isActive: true,
      status: "approved",
    }).sort({ priority: -1, createdAt: -1 });

    return res.status(200).json(designs);
  } catch (error) {
    console.error("GET DESIGNS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};


/// 🛠 ADMIN ALL
exports.getAllDesignsForAdmin = async (req, res) => {
  try {
    const designs = await Design.find().sort({ createdAt: -1 });
    return res.status(200).json(designs);
  } catch (error) {
    console.error("GET ALL DESIGNS ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};


/// 🛠 PENDING DESIGNS
exports.getPendingDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ status: "pending" });
    res.json(designs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/// ✅ APPROVE
exports.approveDesign = async (req, res) => {
  try {
    const design = await Design.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        isActive: true,
      },
      { new: true }
    );

    res.json({ message: "Approved", design });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/// ❌ REJECT
exports.rejectDesign = async (req, res) => {
  try {
    const design = await Design.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        isActive: false,
      },
      { new: true }
    );

    res.json({ message: "Rejected", design });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/// ✏ UPDATE
exports.updateDesign = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const design = await Design.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    return res.json({
      message: "Design updated successfully",
      design,
    });
  } catch (error) {
    console.error("UPDATE DESIGN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};


/// 🗑 DELETE
exports.deleteDesign = async (req, res) => {
  try {
    const design = await Design.findByIdAndDelete(req.params.id);

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    return res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("DELETE DESIGN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};


/// 🔄 TOGGLE
exports.toggleDesignStatus = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    design.isActive = !design.isActive;
    await design.save();

    res.json({
      message: "Design status updated",
      design,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/// ⭐ PRIORITY
exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;

    const design = await Design.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    );

    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    res.json({
      message: "Priority updated",
      design,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};