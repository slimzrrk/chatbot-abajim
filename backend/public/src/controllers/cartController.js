const cartService = require("../services/cartService");

exports.addToCart = async (req, res) => {
  try {
    const item = await cartService.addToCart(req.user.id, req.body);
    res.status(201).json({ message: "Ajouté au panier", item });
  } catch (err) {
    console.error("❌ Erreur dans CartController addToCart:", err.message);
    res.status(400).json({ message: err.message || "Erreur lors de l'ajout au panier" });
  }
};

exports.getCart = async (req, res) => {
  try {
    const items = await cartService.getUserCart(req.user.id);
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération du panier" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    await cartService.removeCartItem(req.params.id, req.user.id);
    res.status(200).json({ message: "Item supprimé du panier" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await cartService.clearCart(req.user.id);
    res.status(200).json({ message: "Panier vidé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors du vidage du panier" });
  }
};
