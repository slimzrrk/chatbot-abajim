const express = require("express");
const router = express.Router();
const walletController = require("../controllers/WalletController");
const authenticateToken = require("../config/middleware/authMiddleware");

router.post("/checkout", authenticateToken, walletController.checkout);
router.get("/balance", authenticateToken, walletController.getBalance);
router.post("/recharge", authenticateToken, walletController.recharge);

module.exports = router;
