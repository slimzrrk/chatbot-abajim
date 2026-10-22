const express = require("express");
const WebinarController = require("../controllers/WebinarController");
const LikeController = require("../controllers/likeController");

const router = express.Router();

// ✅ Route pour récupérer les webinaires par niveau (placer avant /:id)
router.get("/level/:levelId", WebinarController.getWebinarsByLevel);

// ✅ Route pour récupérer tous les webinaires
router.get("/", WebinarController.getAllWebinars);

// ✅ Route pour récupérer un webinar par son ID
router.get("/:id", WebinarController.getWebinarById);

// ✅ Route pour liker un webinar
router.post("/:id/like", LikeController.likeWebinar);
//search 
router.get("/search/:levelId/:keyword", WebinarController.searchWebinars);


module.exports = router;
