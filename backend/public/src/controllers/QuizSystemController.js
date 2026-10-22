const QuizSystemService = require("../services/QuizSystemService");

class QuizSystemController {

    async getAllQuizzes(req, res) {
        try {
            const { webinar_id } = req.query;
            const quizzes = await QuizSystemService.getAllQuizzes(webinar_id);
            res.json(quizzes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la récupération des quizzes." });
        }
    }

    async getQuizById(req, res) {
        try {
            const { id } = req.params;
            const quiz = await QuizSystemService.getQuizById(id);
            res.json(quiz);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la récupération du quiz." });
        }
    }

    async submitResult(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
    
            // 🔒 Vérifier si l'utilisateur a déjà un résultat
            const existingResult = await QuizSystemService.getQuizResultForUser(id, userId);
    
            if (existingResult) {
                return res.status(400).json({ message: "Vous avez déjà passé ce quiz." });
            }
    
            const resultData = req.body;
    
            const result = await QuizSystemService.submitResult(id, userId, resultData);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la soumission du résultat." });
        }
    }
    

    async getQuizResultForUser(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
    
            const result = await QuizSystemService.getQuizResultForUser(id, userId);
            res.json(result || null);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la récupération du résultat." });
        }
    }    

    async getQuizResults(req, res) {
        try {
            const { id } = req.params;
            const results = await QuizSystemService.getQuizResults(id);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la récupération des résultats." });
        }
    }

    async getUserResults(req, res) {
        try {
            const { id } = req.params;
            const results = await QuizSystemService.getUserResults(id);
            res.json(results);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la récupération des résultats utilisateur." });
        }
    }
}

module.exports = new QuizSystemController();
