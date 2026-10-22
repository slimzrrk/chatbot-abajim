const TeacherFollowerService = require("../../services/teachers/TeacherFollowerService");

class TeacherFollowerController {

    static async getMyFollowers(req, res) {
        try {
            const teacherId = req.params.id; // ou req.user.id si token plus tard
            const followers = await TeacherFollowerService.getFollowers(teacherId); // ✅ FIXED ICI
            res.status(200).json(followers);
        } catch (error) {
            console.error("❌ [Controller] getMyFollowers error:", error.message);
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = TeacherFollowerController;
