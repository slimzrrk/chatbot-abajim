const TeacherWebinarService = require('../../services/teachers/TeacherWebinarService');


class TeacherWebinarController {

    static async getMyWebinars(req, res) {
        try {
            const teacherId = req.params.id;

            const webinars = await TeacherWebinarService.getMyWebinars(teacherId);

            res.status(200).json(webinars);
        } catch (err) {
            console.error("❌ [Controller] getMyWebinars error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }

}

module.exports = TeacherWebinarController;
