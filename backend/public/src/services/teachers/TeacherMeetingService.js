const { Meeting, MeetingFile, MeetingTime, ReserveMeeting, User, Material, Submaterial } = require('../../models');

class TeacherMeetingService {

    // ✅ Récupérer tous les meetings créés par le professeur
    static async getMyMeetings(teacherId) {

        const meetings = await Meeting.findAll({
            where: { teacher_id: teacherId },
            include: [
                { model: MeetingFile, as: 'files' },
                {
                    model: MeetingTime,
                    as: 'times',
                    include: [
                        { model: Material, as: 'material', attributes: ['id', 'name'] },
                        { model: Submaterial, as: 'submaterial', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        return meetings;
    }

    // ✅ Récupérer les réservations des meetings de ce professeur
    static async getReservationsForMyMeetings(teacherId) {
        const reservations = await ReserveMeeting.findAll({
            include: [
                {
                    model: Meeting,
                    as: 'meeting',
                    where: { teacher_id: teacherId },
                    attributes: ['id'],
                    include: [
                        {
                           model: MeetingTime,
                           as: "times",
                           attributes: ["start_time", "end_time", "meet_date"]   // ✅ CORRECT
                        }
                     ]                     
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'avatar']
                }
            ]
        });

        return reservations;
    }

}

module.exports = TeacherMeetingService;
