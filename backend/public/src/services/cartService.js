const db = require("../models");
const Cart = db.Cart;
const Webinar = db.Webinar;
const Meeting = db.Meeting;
const User = db.User;
const WebinarChapter = db.WebinarChapter;
const File = db.File;
const FileTranslation = db.FileTranslation;
const WebinarTranslation = db.WebinarTranslation;
const ReserveMeeting = db.ReserveMeeting;

const addToCart = async (userId, payload) => {
  if (payload.reserve_meeting_id) {
    const reservation = await ReserveMeeting.findByPk(payload.reserve_meeting_id);
    if (!reservation) {
      throw new Error("Réservation non trouvée dans la base de données.");
    }
  }

  return await Cart.create({
    creator_id: userId,
    webinar_id: payload.webinar_id || null,
    reserve_meeting_id: payload.reserve_meeting_id || null,
    subscribe_id: payload.subscribe_id || null,
    promotion_id: payload.promotion_id || null,
    ticket_id: payload.ticket_id || null,
    special_offer_id: payload.special_offer_id || null,
    product_discount_id: payload.product_discount_id || null,
    created_at: Date.now()
  });
};

const getUserCart = async (userId) => {
  return await Cart.findAll({
    where: { creator_id: userId },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: User,
        as: "creator",  // 🔥 C'est ça qui va te donner le full_name et level_id
        attributes: ["id", "full_name", "level_id"]
      },
      {
        model: Webinar,
        as: "webinar",
        include: [
          {
            model: WebinarTranslation,
            as: "translations",
            where: { locale: "ar" },
            required: false,
            attributes: ["title"],
          },
          {
            model: User,
            as: "teacher",
            attributes: ["id", "full_name", "avatar", "bio"]
          },
          {
            model: WebinarChapter,
            as: "chapters",
            include: [
              {
                model: File,
                as: "files",
                include: [
                  {
                    model: FileTranslation,
                    as: "translations",
                    where: { locale: "ar" },
                    required: false,
                    attributes: ["title"]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        model: Meeting,
        as: "meeting",
        include: [
          {
            model: User,
            as: "teacher",
            attributes: ["id", "full_name", "avatar", "bio"]
          }
        ]
      }
    ]
  });
};


const removeCartItem = async (itemId, userId) => {
  return await Cart.destroy({
    where: {
      id: itemId,
      creator_id: userId
    }
  });
};

const clearCart = async (userId) => {
  return await Cart.destroy({
    where: { creator_id: userId }
  });
};

module.exports = {
  addToCart,
  getUserCart,
  removeCartItem,
  clearCart
};
