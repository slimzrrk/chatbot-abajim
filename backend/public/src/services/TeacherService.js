const db = require("../models");
const { User, Webinar, WebinarTranslation, UserLevel, UserMatiere, Follow } = db;
const Manuel = db.Manuel;


const TeacherService = {
  async getTeacherById(teacherId) {
    return await User.findByPk(teacherId, {
      attributes: [
        "id",
        "full_name",
        "avatar",
        "bio",
        "about",
        "address",
        "cover_img",
        "avatar_settings",
        "language",
        "school_id",
        "section_id",
        "level_id",
      ],
      include: [
        // 🚨 Ici on corrige -> on met "webinars" (pas videos!)
        {
          model: Webinar,
          as: "webinars", // ✅ CORRECT alias
          attributes: ["id", "image_cover", "status", "created_at"],
          required: false,
          include: [
            {
              model: WebinarTranslation,
              as: "translations",
              where: { locale: "ar" },
              required: false,
              attributes: ["title"],
            },
          ],
        },

        // Levels que le teacher enseigne
        {
          model: UserLevel,
          as: "levels",
          attributes: ["id", "level_id"],
          required: false,
        },

        // Matières (Manuels)
        {
          model: UserMatiere,
          as: "matieres",
          attributes: ["id", "matiere_id"],
          required: false,
          include: [
            {
              model: Manuel,
              as: "manuel",
              attributes: ["id", "name"],
            },
          ],
        },        
        // Followers
        {
          model: Follow,
          as: "followers",
          attributes: ["id", "follower"],
          required: false,
          include: [
            {
              model: User,
              as: "follower_user",
              attributes: ["id", "full_name", "avatar"],
            },
          ],
        },
      ],
    });
  },
};

module.exports = TeacherService;
