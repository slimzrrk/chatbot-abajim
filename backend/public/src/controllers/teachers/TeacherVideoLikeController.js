const TeacherVideoLikeService = require("../../services/teachers/TeacherVideoLikeService");

class TeacherVideoLikeController {

    static async getMyVideosLikes(req, res) {
        try {
            const teacherId = req.params.id;
            const videosLikes = await TeacherVideoLikeService.getMyVideoLikes(teacherId);
            res.status(200).json(videosLikes);
        } catch (error) {
            console.error("❌ [Controller] getMyVideosLikes error:", error.message);
            res.status(500).json({ message: error.message });
        }
    }

}

module.exports = TeacherVideoLikeController;
