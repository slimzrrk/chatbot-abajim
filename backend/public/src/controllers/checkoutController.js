const checkoutService = require("../services/checkoutService");

exports.checkout = async (req, res) => {
  try {
    const order = await checkoutService.checkoutCartWithSubscription(req.user.id, req.body);
    res.status(201).json({
      message: "Commande complétée avec succès",
      order_id: order.id
    });
  } catch (error) {
    console.error("Erreur de checkout:", error);
    res.status(500).json({ message: error.message || "Erreur lors du checkout" });
  }
};
