const { Op } = require("sequelize");
const {
  Webinar,
  WebinarTranslation,
  WebinarChapter,
  File,
  FileTranslation,
  User,
  Order,
  OrderItem,
} = require("../models");

// 🔐 Vérifie si un utilisateur a accès au webinaire
async function isAccessible(webinar, userId) {
  if (!webinar.price || webinar.price === 0) return true;
  if (!userId) return false;

  const paidOrder = await Order.findOne({
    where: { creator_id: userId, status: "paid" },
    include: [
      {
        model: OrderItem,
        as: "items",
        where: { webinar_id: webinar.id },
      },
    ],
  });

  return !!paidOrder;
}

const WebinarService = {
  async getById(id, userId) {
    const webinar = await Webinar.findByPk(id, {
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
          attributes: ["id", "full_name", "avatar", "bio"],
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
                  attributes: ["title"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!webinar) return null;
    webinar.dataValues.isAccessible = await isAccessible(webinar, userId);
    return webinar;
  },

  async getAll(userId) {
    const webinars = await Webinar.findAll({
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
          attributes: ["id", "full_name", "avatar", "bio"],
        },
      ],
    });

    for (const webinar of webinars) {
      webinar.dataValues.isAccessible = await isAccessible(webinar, userId);
    }

    return webinars;
  },

  async getByLevelId(levelId, userId) {
    const webinars = await Webinar.findAll({
      where: { level_id: levelId },
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
          attributes: ["id", "full_name", "avatar", "bio"],
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
                  attributes: ["title"],
                },
              ],
            },
          ],
        },
      ],
    });

    for (const webinar of webinars) {
      webinar.dataValues.isAccessible = await isAccessible(webinar, userId);
    }

    return webinars;
  },

  async searchByKeyword(levelId, keyword, userId) {
    const webinars = await Webinar.findAll({
      where: {
        level_id: levelId,
        [Op.or]: [
          { slug: { [Op.like]: `%${keyword}%` } },
          { "$teacher.full_name$": { [Op.like]: `%${keyword}%` } },
          { "$translations.title$": { [Op.like]: `%${keyword}%` } },
        ],
      },
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
          attributes: ["id", "full_name", "avatar", "bio"],
        },
      ],
    });

    for (const webinar of webinars) {
      webinar.dataValues.isAccessible = await isAccessible(webinar, userId);
    }

    return webinars;
  },
};

module.exports = WebinarService;