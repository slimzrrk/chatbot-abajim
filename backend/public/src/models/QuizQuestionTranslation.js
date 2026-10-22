const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizQuestionTranslation extends Model {}

QuizQuestionTranslation.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  quizzes_question_id: { type: DataTypes.INTEGER, allowNull: false },
  locale: { type: DataTypes.STRING },
  title: { type: DataTypes.TEXT },
  correct: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: "QuizQuestionTranslation",
  tableName: "quiz_question_translations",
  timestamps: false,
});

module.exports = QuizQuestionTranslation;
