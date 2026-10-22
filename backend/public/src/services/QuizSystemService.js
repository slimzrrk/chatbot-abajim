const { Quiz, QuizTranslation, QuizQuestion, QuizQuestionTranslation, QuizAnswer, QuizAnswerTranslation, QuizResult, User } = require("../models");

class QuizSystemService {
    
    async getAllQuizzes(webinarId = null) {
        const where = { status: 'active' };
        if (webinarId) where.webinar_id = webinarId;

        return await Quiz.findAll({
            where,
            include: [
                { model: QuizTranslation, as: 'translations', where: { locale: 'ar' }, required: false }
            ],
            order: [['created_at', 'DESC']]
        });
    }

    async getQuizById(quizId) {
        return await Quiz.findByPk(quizId, {
            include: [
                { model: QuizTranslation, as: 'translations', where: { locale: 'ar' }, required: false },
                {
                    model: QuizQuestion, as: 'questions',
                    include: [
                        { model: QuizQuestionTranslation, as: 'translations', where: { locale: 'ar' }, required: false },
                        {
                            model: QuizAnswer, as: 'answers',
                            include: [
                                { model: QuizAnswerTranslation, as: 'translations', where: { locale: 'ar' }, required: false }
                            ]
                        }
                    ]
                }
            ]
        });
    }

    async submitResult(quizId, userId, resultData) {

        // 🔴🔴 Vérifier s’il a déjà passé ce quiz (Sécurité backend)
        const alreadyExists = await QuizResult.findOne({
            where: { quiz_id: quizId, user_id: userId }
        });

        if (alreadyExists) {
            throw new Error("Vous avez déjà passé ce quiz.");
        }

        return await QuizResult.create({
            quiz_id: quizId,
            user_id: userId,
            results: resultData.results,
            user_grade: resultData.user_grade,
            status: resultData.status,
            created_at: new Date()
        });
    }

    async getQuizResultForUser(quizId, userId) {
        return await QuizResult.findOne({
            where: { quiz_id: quizId, user_id: userId }
        });
    }

    async getQuizResults(quizId) {
        return await QuizResult.findAll({
            where: { quiz_id: quizId },
            include: [
                { model: User, as: 'user' }
            ]
        });
    }

    async getUserResults(userId) {
        return await QuizResult.findAll({
            where: { user_id: userId },
            include: [
                { model: Quiz, as: 'quiz' }
            ]
        });
    }
}

module.exports = new QuizSystemService();
