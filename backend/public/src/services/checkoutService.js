const db = require("../models");
const Order = db.Order;
const OrderItem = db.OrderItem;
const Cart = db.Cart;

const checkoutCartWithSubscription = async (userId, body) => {
  const cartItems = await Cart.findAll({ where: { creator_id: userId } });

  const orderItemsData = [];
  let total = 0;

  // ✅ Ajouter les éléments du panier
  for (const item of cartItems) {
    const contentId = item.webinar_id || item.reserve_meeting_id;
    const modelType = item.webinar_id
      ? "App\\Models\\Webinar"
      : "App\\Models\\ReserveMeeting";

    const itemAmount = 100; // 💡 ou un prix dynamique depuis la BD

    total += itemAmount; // ❗️CETTE LIGNE ÉTAIT MANQUANTE

    orderItemsData.push({
      user_id: userId,
      model_type: modelType,
      model_id: contentId,
      amount: itemAmount,
      tax: 0,
      commission: 0,
      discount: 0,
      total_amount: itemAmount,
      created_at: new Date(),
    });
  }

  // ✅ Ajouter l’abonnement si présent
  if (body.subscribe_id) {
    const subscribeAmount = body.amount || 150;
    total += subscribeAmount;

    orderItemsData.push({
      user_id: userId,
      model_type: "App\\Models\\Subscribe",
      model_id: body.subscribe_id,
      amount: subscribeAmount,
      tax: 0,
      commission: 0,
      discount: 0,
      total_amount: subscribeAmount,
      created_at: new Date(),
    });
  }

  if (orderItemsData.length === 0) {
    throw new Error("Panier vide et aucune souscription détectée.");
  }

  // ✅ Créer la commande
  const order = await Order.create({
    user_id: userId,
    status: "paid",
    payment_method: body.payment_method || "wallet",
    amount: total,
    tax: 0,
    total_discount: 0,
    total_amount: total,
    reference_id: null,
    created_at: new Date()
  });

  // ✅ Ajouter les OrderItems
  for (const item of orderItemsData) {
    await OrderItem.create({ ...item, order_id: order.id });
  }

  // ✅ Vider le panier
  await Cart.destroy({ where: { creator_id: userId } });

  return order;
};

module.exports = { checkoutCartWithSubscription };
