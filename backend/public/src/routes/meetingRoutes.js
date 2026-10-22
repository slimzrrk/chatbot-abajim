const express = require('express');
const router = express.Router();
const MeetingController = require('../controllers/MeetingController');

// Routes de Meetings
// Récupérer tous les meetings, un meeting par ID, les fichiers d'un meeting, les horaires d'un fichier de meeting, réserver un meeting et annuler une réservation
router.get('/', MeetingController.getAllMeetings);

// Récupérer un meeting par ID
router.get('/:id', MeetingController.getMeetingById);

// Récupérer les fichiers d'un meeting par ID
router.get('/:meetingId/files', MeetingController.getFilesByMeetingId);

// Récupérer meeetings by levl 
router.get('/level/:levelId', MeetingController.getMeetingsByLevel);

// Récupérer les horaires d'un fichier de meeting par ID
router.get('/files/:fileId/times', MeetingController.getTimesByFileId);

router.post('/reserve', MeetingController.reserveMeeting);
router.delete('/cancel/:reservationId', MeetingController.cancelReservation);
router.get('/user/:userId', MeetingController.getReservationsByUserId);

// modifier une réservation par ID
router.put('/reserve/:reservationId', MeetingController.updateReservation);



module.exports = router;