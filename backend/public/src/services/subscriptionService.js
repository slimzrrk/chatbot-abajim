const db = require("../models");
const { Order, OrderItem, CardReservation, PaymentProof } = db;

const subscribeToPack = async (
  userId,
  subscribeId,
  amount,
  tax = 0,
  paymentMethod,
  phone = null,
  address = null,
  proofFile = null,
  parentName = null,
  level_id = null,
  enfant_id = null
) => {
  const order = await Order.create({
    user_id: userId,
    status: paymentMethod === "bank" ? "paying" : "pending",
    payment_method: paymentMethod,
    amount,
    tax,
    total_discount: 0,
    total_amount: amount + tax,
    reference_id: null,
    created_at: Date.now(),
  });

  await OrderItem.create({
    user_id: enfant_id,
    order_id: order.id,
    model_type: "App\\Models\\Subscribe",
    model_id: subscribeId,
    amount,
    tax,
    commission: 0,
    discount: 0,
    total_amount: amount + tax,
    created_at: Date.now(),
  });

  if (paymentMethod === "cash") {
    if (!phone || !address || !parentName || !level_id) {
      throw new Error("Phone, address, parent name, and level_id are required for cash payments.");
    }

    await CardReservation.create({
      user_id: userId,
      name: parentName, // 🔥 Nom du parent
      phone_number: phone,
      address: address,
      level_id: level_id, // 🔥 Level de l’enfant
      enfant_id: enfant_id, // 🔥 rattacher l’enfant
      status: "waiting",
      livraison: "No",
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

 // ➡️ Paiement bank : ajouter preuve (sans order_id car colonne absente)
if (paymentMethod === "bank") {
    if (!proofFile) {
      throw new Error("Payment proof file is required for bank payments.");
    }
  
    await PaymentProof.create({
      user_id: userId,
      image: proofFile,
      status: "pending",
      level_id: level_id, // ✅ pour suivre le niveau
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return order;
};

module.exports = { subscribeToPack };
