const { Video, Like, User } = require("../../models");

class TeacherVideoLikeService {

    // 📥 Obtenir toutes les vidéos du teacher + likes + qui a liké
    static async getMyVideoLikes(teacherId) {

        // ▶️ 1. Trouver toutes les vidéos du teacher
        const videos = await Video.findAll({
            where: { user_id: teacherId },
            attributes: ['id', 'titre', 'video', 'thumbnail'],
            include: [
                {
                    model: Like,
                    as: "likes_list",
                    attributes: ["id", "user_id"],
                    include: [
                        {
                            model: User,
                            as: "user", 
                            attributes: ["id", "full_name", "avatar"]
                        }
                    ]
                }
            ]
        });

        // ▶️ 2. Reformater les données pour ajouter nombre de likes + users
        const formattedVideos = videos.map(video => ({
            id: video.id,
            titre: video.titre,
            video: video.video,
            thumbnail: video.thumbnail,
            likes_count: video.likes_list.length,
            likes_users: video.likes_list.map(like => like.user)
        }));

        return formattedVideos;
    }

}

module.exports = TeacherVideoLikeService;
