const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const cleanName = file.originalname.replace(/\s/g, "_");
    cb(null, Date.now() + "-" + cleanName);
  },
});

const upload = multer({ storage });

module.exports = upload;