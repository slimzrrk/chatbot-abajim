const express = require("express");
const router = express.Router();
const documentController = require("../controllers/documentController");

router.get("/", documentController.getAllDocuments);
router.get("/manuel/:manuel_id", documentController.getDocumentsByManuel);
router.post("/add", documentController.createDocument);

// 🆕 New route to fetch the correction video URL
router.post("/correction-video", documentController.getCorrectionVideoUrl);

// 📊 Route pour enregistrer une vue sur une vidéo
router.post("/record-view", documentController.recordVideoView);

module.exports = router;
