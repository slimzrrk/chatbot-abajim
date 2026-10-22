const express = require('express');
const router = express.Router();
const { askOpenAI, generateAudio } = require('../controllers/ChatbotController');

router.post('/ask', askOpenAI);
router.post('/generate-audio', generateAudio);
// router.post('/save-voice', saveVoiceMessage); // ❌ Supprimé - sauvegarde intégrée dans askOpenAI

module.exports = router;
