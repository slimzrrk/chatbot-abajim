const express = require('express');
const router = express.Router();
const authenticateToken = require('../config/middleware/authMiddleware');
const { getDashboardForChild, logChildActivity } = require('../controllers/ParentDashboardController'); 


router.get('/dashboard/:childId', authenticateToken, getDashboardForChild);

router.post('/activity', authenticateToken, logChildActivity);

module.exports = router;
