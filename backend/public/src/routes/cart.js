const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authenticateToken = require("../config/middleware/authMiddleware");

router.post("/add", authenticateToken, cartController.addToCart);
router.get("/", authenticateToken, cartController.getCart);
router.delete("/:id", authenticateToken, cartController.removeItem);
router.delete("/", authenticateToken, cartController.clearCart);

module.exports = router;
