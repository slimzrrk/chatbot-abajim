const express = require('express');
const router = express.Router();
const RecoController = require('../controllers/RecoController');

// Routes pour les recommandations
router.get('/health', RecoController.checkServiceHealth);
router.get('/teachers', RecoController.getTeacherRecommendations);
router.get('/exercises', RecoController.getExerciseRecommendations);
router.get('/courses', RecoController.getCourseRecommendations);

module.exports = router;