const MeetingService = require('../services/MeetingService');

class MeetingController {

    // 📌 Récupérer tous les meetings
  // 📌 Récupérer les meetings par level_id
  static async getMeetingsByLevel(req, res) {
    try {
      const { levelId } = req.params;
      const meetings = await MeetingService.getMeetingsByLevel(levelId);
      res.status(200).json(meetings);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des meetings :", error);
      res.status(500).json({ message: 'Erreur lors de la récupération des meetings', error: error.message });
    }
  }

// 📌 Récupérer tous les meetings
static async getAllMeetings(req, res) {
    try {
        const meetings = await MeetingService.getAllMeetings();
        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des meetings', error });
    }
}
   // 📌 Récupérer un meeting par ID
   static async getMeetingById(req, res) {
    try {
      const { id } = req.params;
      const meeting = await MeetingService.getMeetingById(id);

      if (!meeting) return res.status(404).json({ message: 'Meeting non trouvé' });

      res.status(200).json(meeting);
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de la récupération du meeting', error: error.message });
    }
  }

    // 📌 Récupérer les fichiers d'un meeting
    static async getFilesByMeetingId(req, res) {
        try {
            const files = await MeetingService.getFilesByMeetingId(req.params.meetingId);
            res.status(200).json(files);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des fichiers', error });
        }
    }

    // 📌 Récupérer les horaires d'un fichier de meeting
    static async getTimesByFileId(req, res) {
        try {
            const times = await MeetingService.getTimesByFileId(req.params.fileId);
            res.status(200).json(times);
        } catch (error) {
            res.status(500).json({ message: 'Erreur lors de la récupération des horaires', error });
        }
    }
// 📌 Réserver un meeting
static async reserveMeeting(req, res) {
    try {
        const { meeting_id, user_id, meeting_time_id, day, date, start_at, end_at, student_count, paid_amount, meeting_type, status, created_at, reserved_at, payment_method, type, discount, description, link, password } = req.body;

        // Vérification des données requises
        if (!meeting_id || !user_id || !meeting_time_id || !day || !date || !start_at || !end_at || !student_count || !paid_amount || !meeting_type || !status || !created_at || !reserved_at) {
            return res.status(400).json({ message: "Les paramètres requis sont manquants." });
        }

        // Préparer les données à envoyer au service
        const reservationData = {
            meeting_id,
            user_id,
            meeting_time_id,
            day,
            date,
            start_at,
            end_at,
            student_count,
            paid_amount,
            meeting_type,
            status,
            created_at,
            reserved_at,
            payment_method,
            type,
            discount,
            description,
            link,
            password
        };

        // Appeler le service de réservation
        const reservation = await MeetingService.reserveMeeting(reservationData);

        // Retourner la réponse
        res.status(201).json(reservation);

    } catch (error) {
        console.error("❌ Erreur lors de la réservation du meeting : ", error);
        res.status(500).json({ message: 'Erreur lors de la réservation du meeting', error: error.message || error });
    }
}


// 📌 Annuler une réservation
static async cancelReservation(req, res) {
    try {
        const result = await MeetingService.cancelReservation(req.params.reservationId);
        res.status(200).json(result);
    } catch (error) {
        console.error("Erreur lors de l'annulation de la réservation : ", error);
        res.status(500).json({ message: 'Erreur lors de l\'annulation de la réservation', error: error.message });
    }
}

// 📌 Récupérer les réservations d'un utilisateur
static async getReservationsByUserId(req, res) {
    try {
        const reservations = await MeetingService.getReservationsByUserId(req.params.userId);
        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des réservations', error: error.message });
    }
}


// 📌 Modifier une réservation
static async updateReservation(req, res) {
    try {
        const reservation = await MeetingService.updateReservation(req.params.reservationId, req.body);
        res.status(200).json(reservation);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la réservation', error: error.message });
    }
}

}

module.exports = MeetingController;
