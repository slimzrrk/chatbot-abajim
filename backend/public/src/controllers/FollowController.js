const FollowService = require("../services/FollowService");
const User = require("../models/User");

const FollowController = {
  async subscribe(req, res) {
    try {
      const { follower, user_id } = req.body;
      
      if (!follower || !user_id) {
        return res.status(400).json({ error: "Champs manquants" });
      }

      // Vérification des rôles
      const child = await User.findOne({ where: { id: follower, role_id: 8 } });
      const teacher = await User.findOne({ where: { id: user_id, role_id: 4 } });

      if (!child) {
        return res.status(403).json({ error: "Seuls les enfants peuvent suivre des enseignants." });
      }

      if (!teacher) {
        return res.status(403).json({ error: "Vous ne pouvez suivre que des enseignants." });
      }

      const result = await FollowService.subscribe(follower, user_id);
      res.json(result);
    } catch (err) {
      console.error("❌ Erreur d'abonnement :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async unsubscribe(req, res) {
    try {
      const { follower, user_id } = req.body;
      await FollowService.unsubscribe(follower, user_id);
      res.json({ message: "Désabonnement réussi" });
    } catch (err) {
      console.error("❌ Erreur de désabonnement :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async isFollowing(req, res) {
    try {
      const { follower, user_id } = req.params;
      const result = await FollowService.isFollowing(follower, user_id);
      res.json({ isFollowing: result });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async getUserSubscriptions(req, res) {
    try {
      const { follower } = req.params;
      const result = await FollowService.getSubscriptionsByUser(follower);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  async getFollowersCount(req, res) {
    try {
      const { user_id } = req.params;
      const count = await FollowService.countFollowers(user_id);
      res.json({ user_id, followers: count });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = FollowController;
