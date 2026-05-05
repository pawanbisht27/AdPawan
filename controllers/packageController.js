const Package = require("../models/Package");

exports.createPackage = async (req, res) => {
  try {
    const pkg = await Package.create(req.body);

    res.status(201).json({
      message: "Package created",
      package: pkg,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({
      priority: -1,
    });

    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    res.json({
      message: "Package updated successfully",
      package: pkg,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.togglePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    res.json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};