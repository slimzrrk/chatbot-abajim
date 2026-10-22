const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/FollowController");

// ✅ S'abonner à un enseignant
router.post("/subscribe", FollowController.subscribe);

// ✅ Se désabonner
router.delete("/unsubscribe", FollowController.unsubscribe);

// ✅ Vérifier si l'utilisateur suit un enseignant
router.get("/is-following/:follower/:user_id", FollowController.isFollowing);

// ✅ Obtenir la liste des abonnements d’un utilisateur
router.get("/by-user/:follower", FollowController.getUserSubscriptions);

// ✅ Compter les abonnés d’un enseignant
router.get("/count/:user_id", FollowController.getFollowersCount);

module.exports = router;
