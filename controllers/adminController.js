const jwt = require("jsonwebtoken");

exports.adminLogin = (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { role: "admin", email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Admin login success",
        token,
        admin: {
          email,
          role: "admin",
        },
      });
    }

    return res.status(401).json({
      message: "Invalid admin credentials",
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
};