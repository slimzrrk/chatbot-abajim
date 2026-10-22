const { Follow, User } = require("../../models");

class TeacherFollowerService {

// ✅ Obtenir les followers (enfants) d'un enseignant
static async getFollowers(teacherId) {
    const followers = await Follow.findAll({
        where: { user_id: teacherId, status: 'accepted' },
        include: [
            {
                model: User,
                as: "follower_user", // 🚨 c'est ce qui est dans index.js donc obligatoire
                attributes: ["id", "full_name", "avatar"]
            }
        ]
    });

    return followers;

}
}
module.exports = TeacherFollowerService;
