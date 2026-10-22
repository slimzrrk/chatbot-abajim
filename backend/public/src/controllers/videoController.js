const Video = require("../models/Videos"); 
const videoService = require("../services/videoService");

const videoController = {
  getVideoCountByManuel: async (req, res) => {
    try {
      const data = await videoService.countVideosByManuel();
      res.json(data);
    } catch (error) {
      console.error("Erreur lors du comptage des vidéos :", error);
      res.status(500).json({ error: "Erreur serveur." });
    }
  },

  getVideosByManuelId: async (req, res) => {
    const { manuelId } = req.params;

    try {
      const videos = await Video.findAll({ where: { manuel_id: manuelId } });
      return res.status(200).json(videos);
    } catch (err) {
      console.error("❌ Erreur dans getVideosByManuel:", err);
      return res.status(500).json({ error: "Erreur lors de la récupération des vidéos." });
    }
  },
};

module.exports = videoController;
