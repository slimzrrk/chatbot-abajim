const { Notification, NotificationStatus, FollowTeacher, User, MeetingTime, ReserveMeeting } = require('../models');
const { Op } = require("sequelize");

module.exports = {
  async sendNotification({ user_id, title, message, data = {}, sender_id = null }) {
    const created_at = Math.floor(Date.now() / 1000); // ✅ timestamp en secondes

    const notification = await Notification.create({
      user_id,
      sender_id,
      group_id: null,
      title,
      message,
      sender: sender_id !== null ? 'user' : 'system',
      type: 'single',
      data,
      created_at
    });

    await NotificationStatus.create({
      user_id,
      notification_id: notification.id,
      seen_at: 0
    });

    return notification;
  },

  async getNotifications(user_id) {
    return await Notification.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']],
      include: [{ model: NotificationStatus, as: 'statuses', required: false }]
    });
  },

  async markAsSeen(user_id, notification_id) {
    const existing = await NotificationStatus.findOne({
      where: { user_id, notification_id }
    });

    const seen_at = Math.floor(Date.now() / 1000); // ✅ timestamp en secondes

    if (existing) {
      return await NotificationStatus.update(
        { seen_at },
        { where: { user_id, notification_id } }
      );
    } else {
      return await NotificationStatus.create({
        user_id,
        notification_id,
        seen_at
      });
    }
  },

  async deleteNotification(user_id, notification_id) {
    await NotificationStatus.destroy({ where: { user_id, notification_id } });
    return await Notification.destroy({ where: { id: notification_id, user_id } });
  },

  async sendNewMeetingNotification(teacherId, meetingTitle) {
    const followers = await FollowTeacher.findAll({ where: { teacher_id: teacherId } });

    for (const follow of followers) {
      await this.sendNotification({
        user_id: follow.parent_id,
        title: "درس مباشر جديد",
        message: `تم نشر درس مباشر جديد: ${meetingTitle}`,
        data: { type: "meeting" }
      });
    }
  },

  async sendNewWebinarNotification(teacherId, webinarTitle) {
    const followers = await FollowTeacher.findAll({ where: { teacher_id: teacherId } });

    for (const follow of followers) {
      await this.sendNotification({
        user_id: follow.parent_id,
        title: "درس إضافي جديد",
        message: `تم نشر درس إضافي: ${webinarTitle}`,
        data: { type: "webinar" }
      });
    }
  },

  async sendNewPackNotification(userId, packName) {
    await this.sendNotification({
      user_id: userId,
      title: "باقة جديدة",
      message: `تم إضافة الباقة: ${packName}`,
      data: { type: "pack" }
    });
  },

  async sendMeetingStartingSoonNotifications() {
    const now = Math.floor(Date.now() / 1000);
    const tenMinutesLater = now + 10 * 60;

    const sessions = await MeetingTime.findAll({
      where: {
        meet_date: {
          [Op.between]: [now, tenMinutesLater]
        }
      },
      include: [{
        model: ReserveMeeting,
        as: 'reservations',
        include: [{ model: User, as: 'user' }]
      }]
    });

    for (const session of sessions) {
      for (const reservation of session.reservations) {
        await this.sendNotification({
          user_id: reservation.user_id,
          title: "تذكير بالحصة",
          message: `سيبدأ اللقاء قريبًا خلال 10 دقائق.`,
          data: { type: "meeting", meeting_time_id: session.id }
        });
      }
    }
  }
};
