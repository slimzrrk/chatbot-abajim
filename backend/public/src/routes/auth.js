const express = require('express');
const userController = require('../controllers/userController');
const { validateRegistration } = require('../config/middleware/validationMiddleware');
const authenticateToken = require('../config/middleware/authMiddleware'); // ✅ Fix Import
const { sendOTP, verifyOTP, resetPassword, switchChildSession } = require('../controllers/authController'); // ✅ Fix Import

const router = express.Router();


router.post('/register', validateRegistration, userController.register);
router.post('/login', userController.login);
router.get("/me", authenticateToken, userController.getLoggedInUser);

// OTP & Password Reset
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

// ✅ Switching between children accounts (ensure function name matches export)
router.post("/switch-child", authenticateToken, switchChildSession);


module.exports = router;
