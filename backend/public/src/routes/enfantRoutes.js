const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const enfantController = require("../controllers/enfantController");
const authenticateToken = require("../config/middleware/authMiddleware");
// ajouter une photo personnel de l'enfant par le parent 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "uploads/kids";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `kid-${Date.now()}${ext}`);
    },
  });
  const upload = multer({ storage });

// ✅ Get all children for authenticated parent
router.get("/", authenticateToken, enfantController.getChildrenByParent);
// ✅ Get all children by a specific parent ID (For Admins)
router.get("/parent/:id", authenticateToken, enfantController.getChildrenByParentId);
// ✅ Get all child by a specific parent ID (For Admins)
router.get("/first-child/:id", authenticateToken, enfantController.getChildByParentId);
// ✅ Add a new child
router.post("/add", authenticateToken, enfantController.addChild);

// ✅ Update an existing child
router.put("/update/:id", authenticateToken, enfantController.updateChild);

// ✅ Delete a child
router.delete("/delete/:id", authenticateToken, enfantController.deleteChild);
// Add avatar to kid 
router.post("/avatar/:id", authenticateToken, upload.single("avatar"), enfantController.uploadKidAvatar);

module.exports = router;
