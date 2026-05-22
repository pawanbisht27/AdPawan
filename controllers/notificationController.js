const User = require("../models/User");

exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    console.log("USER ID:", req.user);
    console.log("FCM TOKEN:", fcmToken);

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findByIdAndUpdate(
  req.user,
  {
    $addToSet: { fcmTokens: fcmToken }
  },
  { new: true }
);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "FCM token saved successfully",
      fcmToken,
    });
  } catch (error) {
    console.error("SAVE FCM ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};