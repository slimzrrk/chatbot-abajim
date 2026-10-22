const Video = require('../../models/Videos');

class TeacherVideoService {

    static async getMyVideos(teacherId) {
        try {
            const videos = await Video.findAll({
                where: { user_id: teacherId },
                attributes: [
                    "id",
                    "titre",
                    "video",
                    "page",
                    "description",
                    "numero",
                    "manuel_id",
                    "thumbnail",
                    "likes",
                    "vues",
                    "total_minutes_watched",
                    "status"
                ],
                order: [['id', 'DESC']]  // Facultatif, pour trier par dernières vidéos
            });

            return videos;
        } catch (err) {
            throw new Error("Erreur lors de la récupération des vidéos.");
        }
    }
}

module.exports = TeacherVideoService;
