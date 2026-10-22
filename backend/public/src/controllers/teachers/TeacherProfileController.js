const ProfileTeacherService = require('../../services/teachers/TeacherProfileService'); 

class TeacherProfileController {

    static async getProfile(req, res) {
        const { id } = req.params;

        console.log("➡️ [Controller] Get profile for ID:", id);

        try {
            const teacher = await TeacherProfileService.getProfile(id);
            res.status(200).json(teacher);
        } catch (error) {
            console.error("❌ [Controller] Get profile error:", error.message);
            res.status(404).json({ message: error.message });
        }
    }
    static async updateProfile(req, res) {
        try {
            const avatar = req.file; // Multer gives this
            const updatedTeacher = await ProfileTeacherService.updateProfileById(req.params.id, req.body, avatar);
            res.json({ message: "Profil mis à jour avec succès.", teacher: updatedTeacher });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
}

module.exports = TeacherProfileController;
