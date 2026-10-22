const LikeService = require("../services/LikeService");

const LikeController = {
  async likeWebinar(req, res) {
    try {
      // ✅ Vérifie si req.user est bien défini (problème potentiel d'auth middleware)
      if (!req.user || !req.user.id) {
        console.error("❌ Erreur : req.user est undefined !");
        return res.status(401).json({ error: "Utilisateur non authentifié." });
      }

      const user_id = req.user.id; // ✅ Extraire l'ID utilisateur depuis le middleware d'auth
      const video_id = req.params.id; // ✅ Récupération de l'ID de la vidéo

      const result = await LikeService.toggleLike(user_id, video_id);
      res.json(result);
    } catch (error) {
      console.error("❌ Erreur LikeService:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
// ✅ Ajouter ou retirer un favori
async toggleFavorite(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }

    const user_id = req.user.id;
    const webinar_id = req.params.id;

    const result = await LikeService.toggleFavorite(user_id, webinar_id);
    res.json(result); // ✅ Retourne { message: "...", isFavorite: true/false }
  } catch (error) {
    console.error("❌ Erreur toggleFavorite:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
},

// ✅ Récupérer tous les favoris
async getFavorites(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Utilisateur non authentifié." });
    }

    const user_id = req.user.id;
    const favorites = await LikeService.getFavoriteWebinars(user_id);
    res.json(favorites);
  } catch (error) {
    console.error("❌ Erreur getFavorites:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}


};


module.exports = LikeController;
