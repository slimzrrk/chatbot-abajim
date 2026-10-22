const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

// 📩 Envoyer une notification personnalisée à un enfant
router.post('/child/send', NotificationController.sendToChild);

// 📢 Envoyer une notification automatique pour un nouveau meeting (enseignant → parents abonnés)
router.post('/meeting', NotificationController.sendNewMeetingNotification);

// 📢 Envoyer une notification automatique pour un nouveau cours supplémentaire (webinar)
router.post('/webinar', NotificationController.sendNewWebinarNotification);

// 📢 Envoyer une notification automatique pour un nouveau pack
router.post('/pack', NotificationController.sendNewPackNotification);

// ⏰ Envoyer automatiquement les notifications pour meetings qui commencent dans 10 minutes
router.get('/meetings/soon', NotificationController.sendMeetingsStartingSoon);

// 🔎 Voir toutes les notifications d'un enfant
router.get('/child/:userId', NotificationController.getChildNotifications);

// 👁️ Marquer une notification comme lue
router.post('/child/seen', NotificationController.markNotificationAsSeen);

// 🗑️ Supprimer une notification
router.delete('/child/:userId/:id', NotificationController.deleteNotification);

module.exports = router;
