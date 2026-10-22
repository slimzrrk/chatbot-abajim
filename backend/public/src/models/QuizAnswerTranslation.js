const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizAnswerTranslation extends Model {}

QuizAnswerTranslation.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  quizzes_questions_answer_id: { type: DataTypes.INTEGER, allowNull: false },
  locale: { type: DataTypes.STRING },
  title: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: "QuizAnswerTranslation",
  tableName: "quizzes_questions_answer_translations",
  timestamps: false,
});

module.exports = QuizAnswerTranslation;
