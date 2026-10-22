const { Op } = require('sequelize');
const { Meeting, MeetingFile, MeetingTime, ReserveMeeting, Sale, User, Material, Submaterial } = require('../models');
const NotificationService = require('./NotificationService');
class MeetingService {

  // 📈 Récupérer tous les meetings (sessions futures uniquement)
  static async getAllMeetings() {
    const now = new Date();
    const meetings = await Meeting.findAll({
      include: [
        { model: MeetingFile, as: 'files' },
        { model: User, as: 'teacher', attributes: ['id', 'full_name', 'avatar'] },
        { 
          model: MeetingTime,
          as: 'times',
          where: { meet_date: { [Op.gte]: now } },
          include: [
            { model: Material, as: 'material', attributes: ['id', 'name'] },
            { model: Submaterial, as: 'submaterial', attributes: ['id', 'name'] }
          ]
        }
      ]
    });
    return meetings.filter(meeting => meeting.times.length > 0);
  }

  // 📈 Récupérer meetings par niveau (sessions futures uniquement)
  static async getMeetingsByLevel(levelId, filters = {}) {
    const now = Math.floor(Date.now() / 1000); // Timestamp Unix

    // Construire les conditions de filtrage pour MeetingTime
    const timeWhere = {
      level_id: levelId,
      meet_date: { [Op.gte]: now }
    };

    // Filtrage par matière si spécifiée
    if (filters.matiereId) {
      timeWhere.matiere_id = filters.matiereId;
    }

    // Construire les conditions de filtrage pour Meeting
    const meetingWhere = {};

    // Filtrage par professeur si spécifié
    if (filters.teacherId) {
      meetingWhere.teacher_id = filters.teacherId;
    }

    const meetings = await Meeting.findAll({
      where: meetingWhere,
      include: [
        {
          model: MeetingTime,
          as: 'times',
          where: timeWhere,
          include: [
            { model: Material, as: 'material', attributes: ['id', 'name'] },
            { model: Submaterial, as: 'submaterial', attributes: ['id', 'name'] }
          ]
        },
        { model: User, as: 'teacher', attributes: ['id', 'full_name', 'avatar'] }
      ]
    });
    return meetings.filter(meeting => meeting.times.length > 0);
  }

  // 📈 Récupérer un meeting par ID
  static async getMeetingById(meetingId) {
    return await Meeting.findOne({
      where: { id: meetingId },
      include: [
        {
          model: MeetingTime,
          as: 'times',
          include: [
            { model: Material, as: 'material', attributes: ['id', 'name'] },
            { model: Submaterial, as: 'submaterial', attributes: ['id', 'name'] }
          ]
        },
        { model: User, as: 'teacher', attributes: ['id', 'full_name', 'avatar'] }
      ]
    });
  }

  // 📈 Récupérer les horaires d'un fichier
  static async getTimesByFileId(fileId) {
    return await MeetingTime.findAll({ where: { meeting_id: fileId } });
  }

  // 🔒 Réserver une session avec mise à jour automatique des reserved_students
  static async reserveMeeting(data) {
    try {
      const meeting = await Meeting.findByPk(data.meeting_id);
      if (!meeting) throw new Error('Meeting non trouvé.');

      const teacher = await User.findOne({
        where: { id: meeting.teacher_id, role_id: 4 }
      });
      if (!teacher) throw new Error('Enseignant non trouvé.');

      const meetingTime = await MeetingTime.findByPk(data.meeting_time_id);
      if (!meetingTime) throw new Error('Session non trouvée.');

      const currentReservationsCount = await ReserveMeeting.count({
        where: { meeting_time_id: data.meeting_time_id }
      });

      if (currentReservationsCount >= meetingTime.max_students) {
        throw new Error('Cette session est déjà complète.');
      }

      const paidAmount = parseFloat(data.paid_amount);
      const discount = parseFloat(data.discount || 0);

      const sale = await Sale.create({
        seller_id: teacher.id,
        buyer_id: data.user_id,
        payment_method: data.payment_method || 'card',
        amount: paidAmount,
        total_amount: paidAmount - discount,
        created_at: Math.floor(Date.now() / 1000),
        type: data.type || 'meeting'
      });

      const reservation = await ReserveMeeting.create({
        meeting_id: data.meeting_id,
        sale_id: sale.id,
        user_id: data.user_id,
        meeting_time_id: data.meeting_time_id,
        day: data.day,
        date: data.date,
        start_at: data.start_at,
        end_at: data.end_at,
        student_count: data.student_count,
        paid_amount: data.paid_amount,
        meeting_type: data.meeting_type,
        discount: data.discount,
        link: data.link,
        password: data.password,
        description: data.description,
        status: data.status,
        created_at: data.created_at,
        locked_at: data.locked_at,
        reserved_at: data.reserved_at
      });

      // 💡 Mise à jour du nombre d'élèves après réservation
      const updatedReservations = await ReserveMeeting.count({
        where: { meeting_time_id: data.meeting_time_id }
      });

      await meetingTime.update({ reserved_students: updatedReservations });

      return reservation;

    } catch (error) {
      console.error('Erreur lors de la réservation:', error.message);
      throw error;
    }
  }

  // ✅ Ajouter cette fonction pour récupérer les réservations d'un user
  static async getReservationsByUserId(userId) {
    const reservations = await ReserveMeeting.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Meeting,
          as: 'meeting',
          include: [
            { model: User, as: 'teacher', attributes: ['id', 'full_name', 'avatar'] },
            {
              model: MeetingTime,
              as: 'times',
              include: [
                { model: Material, as: 'material', attributes: ['id', 'name'] },
                { model: Submaterial, as: 'submaterial', attributes: ['id', 'name'] }
              ]
            }
          ]
        }
      ]
    });

    return reservations;
  }
}
// Quand un nouveau meeting est publié
async function notifyNewMeeting(meeting) {
  const teacherId = meeting.teacher_id;

  // Trouver les parents abonnés à ce professeur
  const subscribers = await User.findAll({
    where: { role_id: 3 }, // 👨‍👩‍👧‍👦 Parents
    include: [
      {
        model: Favorite,
        as: "favorites",
        required: false,
        where: { webinar_id: null } // 🔥 À ajuster selon la logique d'abonnement
      }
    ]
  });

  for (const parent of subscribers) {
    await NotificationService.sendNotification({
      user_id: parent.id,
      title: "📝 لقاء مباشر جديد",
      message: `تم نشر لقاء جديد مع الأستاذ ${meeting.teacher.full_name}.`,
      data: { meetingId: meeting.id },
    });
  }
}

// 🔔 Vérifier les sessions 10 minutes avant
async function notifyMeetingsStartingSoon() {
  const now = Math.floor(Date.now() / 1000);
  const tenMinutesLater = now + (10 * 60);

  const sessions = await MeetingTime.findAll({
    where: {
      meet_date: {
        [Op.lte]: tenMinutesLater,
        [Op.gte]: now
      }
    },
    include: [
      {
        model: Meeting,
        as: 'meeting',
        include: [{ model: User, as: 'teacher' }]
      }
    ]
  });

  for (const session of sessions) {
    const reservations = await ReserveMeeting.findAll({
      where: { meeting_time_id: session.id },
      include: [{ model: User, as: 'user' }]
    });

    for (const reservation of reservations) {
      await NotificationService.sendNotification({
        user_id: reservation.user_id,
        title: "⏰ تنبيه: حصتك ستبدأ بعد قليل",
        message: `الحصة مع الأستاذ ${session.meeting.teacher.full_name} ستبدأ خلال 10 دقائق.`,
        data: { meetingId: session.meeting_id, timeId: session.id },
      });
    }
  }
}
module.exports = MeetingService;
