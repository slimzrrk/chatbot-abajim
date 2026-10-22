const express = require("express");
const TeacherController = require("../controllers/TeacherController");

const router = express.Router();

// Route pour récupérer les détails d'un enseignant
router.get("/:id", TeacherController.getTeacherById);

module.exports = router;
