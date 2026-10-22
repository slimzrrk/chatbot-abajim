const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const authenticateToken = require('../config/middleware/authMiddleware');
const { uploadAvatar } = require("../controllers/userController");

// ✅ Config multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/avatars");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ✅ Upload avatar route
router.post("/add", authenticateToken, upload.single("avatar"), uploadAvatar);

module.exports = router;
