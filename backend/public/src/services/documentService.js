const Document = require("../models/Document");
const db = require("../models/index");
const Video = db.Video;
const User = db.User;
const Follow = db.Follow;
const UserView = db.UserView;
const { Op } = require('sequelize');



const getAllDocuments = async () => {
    try {
      return await Document.findAll();
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des documents :", error.message);
      throw error;
    }
  };

const getDocumentsByManuel = async (manuelId) => {
  return await Document.findAll({ where: { manuel_id: manuelId } });
};

const createDocument = async (data) => {
  return await Document.create({
    name: data.name,
    nombre_page: data.nombre_page,
    pdf: data.pdf,
    manuel_id: data.manuel_id,
    "3d_path_teacher": data["3d_path_teacher"],
    "pathenfant": data["pathenfant"],
  });
};
// 🆕 Function to generate the correction video URL
const getCorrectionVideoUrl = async (manuelId, icon, page, childId = null) => {
  try {
    if (!manuelId || !icon || !page) {
      throw new Error("manuel_id, icon, and page are required.");
    }

    const video = await Video.findOne({
      where: {
        manuel_id: manuelId,
        numero: icon,
        page: page,
        status: "APPROVED",
      },
      include: [
        {
          model: User,
          as: "teacher",
          attributes: ["id", "full_name", "avatar"],
          include: [
            {
              model: Follow,
              as: "followers",
              include: [
                {
                  model: User,
                  as: "follower_user",
                  attributes: ["id", "full_name", "avatar"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!video || !video.video) {
      throw new Error("Vidéo introuvable pour ces paramètres.");
    }

    // ✅ Enregistrer la vue si un enfant est identifié
    if (childId && video.id) {
      const [view, created] = await UserView.findOrCreate({
        where: { user_id: childId, video_id: video.id },
        defaults: { created_at: new Date(), updated_at: new Date() },
      });
      if (created) {
        console.log(`✅ Vue enregistrée pour enfant ${childId} sur vidéo ${video.id}`);
      }
    }

    return {
      id: video.id,
      videoUrl: video.video,
      title: video.titleAll || video.titre || "بدون عنوان",
      views: video.vues || 0,
      likes: video.likes || 0,
      teacher: {
        id: video.teacher?.id || null,
        full_name: video.teacher?.full_name || "أستاذ غير معروف",
        avatar: video.teacher?.avatar || null,
        followers: video.teacher?.followers || [],
      },
    };
  } catch (error) {
    console.error("❌ Erreur dans getCorrectionVideoUrl:", error.message);
    throw error;
  }
};
/**
 * Enregistre une vue pour une vidéo par un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {number} videoId - ID de la vidéo
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const recordVideoView = async (userId, videoId) => {
  try {
    if (!userId || !videoId) {
      throw new Error("userId et videoId sont requis");
    }

    // Vérifier si la vidéo existe
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error(`Vidéo avec ID ${videoId} introuvable`);
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error(`Utilisateur avec ID ${userId} introuvable`);
    }

    // Enregistrer la vue
    const [view, created] = await UserView.findOrCreate({
      where: { user_id: userId, video_id: videoId },
      defaults: { created_at: new Date(), updated_at: new Date() }
    });

    // Si la vue existe déjà, mettre à jour la date de mise à jour
    if (!created) {
      await view.update({ updated_at: new Date() });
    }

    // Incrémenter le compteur de vues de la vidéo si c'est une nouvelle vue
    if (created) {
      await video.increment('vues', { by: 1 });
      console.log(`✅ Vue enregistrée pour utilisateur ${userId} sur vidéo ${videoId}`);
    } else {
      console.log(`ℹ️ Vue déjà existante pour utilisateur ${userId} sur vidéo ${videoId}, mise à jour effectuée`);
    }

    return {
      success: true,
      created,
      message: created ? "Vue enregistrée avec succès" : "Vue mise à jour avec succès"
    };
  } catch (error) {
    console.error(`❌ Erreur dans recordVideoView: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  getAllDocuments,
  getDocumentsByManuel,
  createDocument,
  getCorrectionVideoUrl,
  recordVideoView,
};
