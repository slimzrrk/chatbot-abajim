const express = require("express");
const router = express.Router();
const { getAllManuels, getManuelById, getManuelsByLevel } = require("../controllers/manuelController");

// 📌 Récupérer tous les manuels disponibles
router.get("/", getAllManuels);

// 📌 Récupérer un manuel spécifique avec ses documents et vidéos
router.get("/:id", getManuelById);

// 📌 Récupérer les manuels par niveau scolaire
router.get("/level/:level_id", getManuelsByLevel);

module.exports = router;
