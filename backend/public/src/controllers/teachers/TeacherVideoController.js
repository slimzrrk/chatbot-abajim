const TeacherVideoService = require('../../services/teachers/TeacherVideoService');

class TeacherVideoController {

    static async getMyVideos(req, res) {
        try {
            const teacherId = req.params.id;  // ✅ PRENDRE DEPUIS LES PARAMS PAS req.user
            const videos = await TeacherVideoService.getMyVideos(teacherId);
            res.status(200).json(videos);
        } catch (err) {
            console.error("❌ [Controller] GetMyVideos error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }
}

module.exports = TeacherVideoController;
