const walletService = require("../services/walletService");

exports.checkout = async (req, res) => {
  try {
    const result = await walletService.checkout(req.user.id);
    res.status(200).json({ message: "Paiement réussi", ...result });
  } catch (err) {
    console.error("❌ Checkout Error:", err.message);
    res.status(400).json({ message: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.user.id);
    res.status(200).json({ balance });
  } catch (err) {
    console.error("❌ Get Balance Error:", err.message);
    res.status(400).json({ message: err.message });
  }
};
exports.recharge = async (req, res) => {
    try {
      console.log("👤 Recharging user ID:", req.user.id); // vérifie que c'est correct
      const amount = req.body.amount;
      if (!amount || isNaN(amount)) throw new Error("Montant invalide");
  
      const newBalance = await walletService.recharge(req.user.id, amount);
      res.status(200).json({ message: "Recharge réussie", newBalance });
    } catch (err) {
      console.error("❌ Recharge Error:", err.message);
      res.status(400).json({ message: err.message });
    }
  };
  