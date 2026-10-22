const { Webinar, WebinarTranslation, User, Sale } = require('../../models');

class TeacherWebinarService {

    static async getMyWebinars(teacherId) {

        // ✅ Récupérer les webinars du professeur
        const webinars = await Webinar.findAll({
            where: { teacher_id: teacherId },
            include: [
                {
                    model: WebinarTranslation,
                    as: "translations",
                    where: { locale: "ar" },
                    required: false,
                    attributes: ["title"]
                },
                {
                    model: User,
                    as: "teacher",
                    attributes: ["id", "full_name", "avatar", "bio"]
                },
                {
                    model: Sale,
                    as: "webinarSales",
                    attributes: ["id", "buyer_id"]
                }
            ]
        });

        // ✅ Formatter proprement
        const formatted = webinars.map(w => ({
            id: w.id,
            titre: w.translations?.length ? w.translations[0].title : null,
            vues: w.vues,
            acheteurs: w.webinarSales.length
        }));

        return formatted;
    }

}

module.exports = TeacherWebinarService;
