const express = require("express");
const router = express.Router();
const QuizSystemController = require("../controllers/QuizSystemController");
const authenticateTokenChild = require("../config/middleware/authenticateTokenChild");

router.get("/", QuizSystemController.getAllQuizzes);
router.get("/:id", QuizSystemController.getQuizById);
router.get("/:id/result", authenticateTokenChild, QuizSystemController.getQuizResultForUser);
router.post("/:id/result", authenticateTokenChild, QuizSystemController.submitResult);
router.get("/:id/results", authenticateTokenChild, QuizSystemController.getQuizResults);
router.get("/users/:id/quizzes-results", authenticateTokenChild, QuizSystemController.getUserResults);

module.exports = router;
