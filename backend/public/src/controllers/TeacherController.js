const TeacherService = require("../services/TeacherService");

const TeacherController = {
  async getTeacherById(req, res) {
    try {
      const teacher = await TeacherService.getTeacherById(req.params.id);
      if (!teacher) {
        return res.status(404).json({ error: "Enseignant non trouvé" });
      }
      res.json(teacher);
    } catch (error) {
      console.error("❌ Error fetching teacher details:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = TeacherController;
