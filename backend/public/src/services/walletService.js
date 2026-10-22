const db = require("../models");
const Cart = db.Cart;
const Wallet = db.Wallet;
const { clearCart, getUserCart } = require("./cartService");

const checkout = async (userId) => {
  const wallet = await Wallet.findOne({ where: { user_id: userId } });
  if (!wallet) throw new Error("Wallet introuvable");

  const cartItems = await getUserCart(userId);
  if (cartItems.length === 0) throw new Error("Panier vide");

  let total = 0;
  for (const item of cartItems) {
    const price = item.webinar?.price || item.meeting?.price || 0;
    total += parseFloat(price);
  }

  if (wallet.balance < total) throw new Error("Solde insuffisant");

  wallet.balance -= total;
  await wallet.save();

  await clearCart(userId);

  return { total, newBalance: wallet.balance };
};

const getBalance = async (userId) => {
    const user = await db.User.findByPk(userId);
  
    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }
    if (user.role_id !== 3) {
      throw new Error("Seuls les parents peuvent avoir un portefeuille.");
    }
  
    let wallet = await Wallet.findOne({ where: { user_id: userId } });
  
    if (!wallet) {
      wallet = await Wallet.create({ user_id: userId, balance: 0 });
    }
  
    return wallet.balance;
  };
  
  

  const recharge = async (userId, amount) => {
    let wallet = await Wallet.findOne({ where: { user_id: userId } });
  
    if (!wallet) {
      // Créer un nouveau wallet si absent
      wallet = await Wallet.create({ user_id: userId, balance: 0 });
    }
    const numericAmount = parseFloat(amount); // 👈 très important

  if (isNaN(numericAmount)) {
    throw new Error("Montant invalide");
  }

  wallet.balance = parseFloat(wallet.balance || 0) + numericAmount;

  await wallet.save();

  return wallet.balance;
  };
  

module.exports = { checkout, getBalance, recharge };