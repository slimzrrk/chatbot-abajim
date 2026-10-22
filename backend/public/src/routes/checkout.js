const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkoutController");
const authenticateToken = require("../config/middleware/authMiddleware");

router.post("/checkout", authenticateToken, checkoutController.checkout);

module.exports = router;
