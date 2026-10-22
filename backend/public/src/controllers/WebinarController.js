const WebinarService = require("../services/WebinarService");

const WebinarController = {
  // ✅ Récupérer tous les webinars (avec query locale optionnel)
  async getAllWebinars(req, res) {
    try {
      const userId = req.user?.id;
      const webinars = await WebinarService.getAll(userId);
      res.json(webinars);
    } catch (error) {
      console.error("❌ Erreur serveur getAllWebinars:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Récupérer un webinar par ID (avec query locale optionnel)
  async getWebinarById(req, res) {
    try {
      const userId = req.user?.id;
      const webinar = await WebinarService.getById(req.params.id, userId);
      if (!webinar) {
        return res.status(404).json({ error: "Webinar non trouvé" });
      }
      res.json(webinar);
    } catch (error) {
      console.error("❌ Erreur serveur getWebinarById:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Récupérer les webinars par niveau (avec query locale optionnel)
  async getWebinarsByLevel(req, res) {
    try {
      const levelId = req.params.levelId;
      const userId = req.user?.id;
      const webinars = await WebinarService.getByLevelId(levelId, userId);
      res.json(webinars);
    } catch (error) {
      console.error("❌ Erreur serveur getWebinarsByLevel:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // ✅ Recherche par mot-clé (title, slug, ou nom du prof)
  async searchWebinars(req, res) {
    try {
      const { levelId, keyword } = req.params;
      const userId = req.user?.id;
      const webinars = await WebinarService.searchByKeyword(levelId, keyword, userId);
      if (!webinars || webinars.length === 0) {
        return res.status(404).json({ error: "Aucun webinaire trouvé" });
      }
      res.json(webinars);
    } catch (error) {
      console.error("❌ Erreur serveur searchWebinars:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = WebinarController;