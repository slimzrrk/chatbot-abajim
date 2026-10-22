const TeacherMeetingService = require('../../services/teachers/TeacherMeetingService');

class TeacherMeetingController {

    // ✅ Récupérer mes meetings
    static async getMyMeetings(req, res) {
        try {
            const teacherId = req.params.id;

            const meetings = await TeacherMeetingService.getMyMeetings(teacherId);

            res.status(200).json(meetings);
        } catch (err) {
            console.error("❌ [Controller] getMyMeetings error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }

    // ✅ Récupérer les réservations
    static async getMyReservations(req, res) {
        try {
            const teacherId = req.params.id;

            const reservations = await TeacherMeetingService.getReservationsForMyMeetings(teacherId);

            res.status(200).json(reservations);
        } catch (err) {
            console.error("❌ [Controller] getMyReservations error:", err.message);
            res.status(400).json({ message: err.message });
        }
    }
}

module.exports = TeacherMeetingController;
