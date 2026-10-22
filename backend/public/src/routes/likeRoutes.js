const express = require('express');
const router = express.Router();
const LikeController = require('../controllers/likeController');
const authenticateToken = require('../config/middleware/authMiddleware'); 
// Route for toggling like (like/unlike)
router.post('/toggle/:id', authenticateToken, LikeController.likeWebinar);
// ✅ Toggle Favoris (Ajouter/Retirer)
router.post('/favorite/:id', authenticateToken, LikeController.toggleFavorite);

// ✅ Récupérer les favoris
router.get('/favorites', authenticateToken, LikeController.getFavorites);
module.exports = router;
