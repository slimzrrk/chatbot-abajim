const db = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = db;
const { User, Webinar, WebinarTranslation, Manuel, Meeting, MeetingTime, Video, FileTranslation } = db;

const enrichActivityWithTitle = async (activities) => {
    const enriched = [];
  
    for (const act of activities) {
      const referenceId = act.reference_id;
      let data = {
        reference_id: referenceId,
        action_type: act.action_type,
        created_at: act.created_at,
      };
  
      if (act.action_type === 'book') {
        const manuel = await Manuel.findByPk(referenceId, {
          attributes: ['id', 'name']
        });
        data.book_title = manuel?.name || null;
  
      } else if (act.action_type === 'webinar') {
        const webinar = await Webinar.findByPk(referenceId, {
          include: [{ model: WebinarTranslation, as: 'translations', where: { locale: 'ar' }, required: false }],
          attributes: ['id']
        });
        data.webinar_title = webinar?.translations?.[0]?.title || null;
  
      } else if (act.action_type === 'meeting') {
        const meeting = await Meeting.findByPk(referenceId, {
          include: [{
            model: User,
            as: 'teacher',
            attributes: ['full_name']
          }]
        });
        data.meeting_title = meeting?.teacher?.full_name ? `لقاء مع ${meeting.teacher.full_name}` : null;
  
      } else if (act.action_type === 'video') {
        const video = await Video.findByPk(referenceId, {
          attributes: ['id', 'title']
        });
        data.video_title = video?.title || null;
      }
  
      enriched.push(data);
    }
  
    return enriched;
  };
  
const getChildActivitySummary = async (childId) => {
  const activities = await db.ChildActivity.findAll({
    where: { child_id: childId },
    order: [['created_at', 'DESC']]
  });

  // Filtrage par type
  const videos = activities.filter(a => a.action_type === 'video');
  const books = activities.filter(a => a.action_type === 'book');
  const webinars = activities.filter(a => a.action_type === 'webinar');
  const meetings = activities.filter(a => a.action_type === 'meeting');
  const navigation = activities.filter(a => a.action_type === 'navigation');

  // Dernière activité
  const lastActivity = activities[0]?.created_at || null;

  // Total durée toutes activités
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);

  // Activité par jour (7 derniers jours)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const dailyActivity = await db.ChildActivity.findAll({
    where: {
      child_id: childId,
      created_at: { [Op.gte]: sevenDaysAgo }
    },
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('created_at')), 'day'],
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'actions']
    ],
    group: ['day'],
    order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']]
  });

  // Calcul taux de complétion vidéo (simulé)
  const completionRates = videos.map(v => (v.duration || 0) / 300); // suppose qu'une vidéo fait 5min
  const videoCompletionRate = completionRates.length
    ? Math.min(100, Math.round((completionRates.reduce((a, b) => a + b, 0) / completionRates.length) * 100))
    : 0;

  return {
    total_videos: videos.length,
    total_minutes: Math.floor(totalDuration / 60),
    total_books: books.length,
    total_webinars: webinars.length,
    total_meetings: meetings.length,
    most_recent_activity: lastActivity,
    days_active_this_week: new Set(activities.map(a => new Date(a.created_at).toDateString())).size,
    average_session_duration: Math.floor(totalDuration / Math.max(1, activities.length)),
    video_completion_rate: videoCompletionRate,
    daily_activity: dailyActivity,
    most_frequent_action_type: mostFrequentAction(activities),
    navigation,
    books: await enrichActivityWithTitle(books),
    webinars: await enrichActivityWithTitle(webinars),
    meetings: await enrichActivityWithTitle(meetings),
    videos: await enrichActivityWithTitle(videos), // si tu veux l’ajouter
  
  };
};

const mostFrequentAction = (activities) => {
  const count = {};
  for (const act of activities) {
    count[act.action_type] = (count[act.action_type] || 0) + 1;
  }
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || null;
};

module.exports = {
  getChildActivitySummary,enrichActivityWithTitle
};