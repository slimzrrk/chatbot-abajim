const bcrypt = require('bcryptjs');
const { User } = require('../../models');

class TeacherProfileService {

    static async getProfile(id) {
        const teacher = await User.findOne({ where: { id, role_id: 4 } });

        if (!teacher) throw new Error("Enseignant non trouvé.");

        return {
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
            mobile: teacher.mobile,
            avatar: teacher.avatar,
            bio: teacher.bio,
            role_id: teacher.role_id
        };
    }

    static async updateProfileById(id, data, avatarFile) {

        const teacher = await User.findByPk(id);
        if (!teacher || teacher.role_id !== 4) {
            throw new Error("Enseignant non trouvé.");
        }

        // ✅ Update basic infos
        teacher.full_name = data.full_name || teacher.full_name;
        teacher.mobile = data.mobile || teacher.mobile;
        teacher.bio = data.bio || teacher.bio;

        // ✅ Update password (optional)
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            teacher.password = hashedPassword;
        }

        // ✅ Update avatar if uploaded
        if (avatarFile) {
            teacher.avatar = avatarFile.path; // Save path to DB
        }

        await teacher.save();

        return teacher;
    }
}

module.exports = TeacherProfileService;
