const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizAnswer extends Model {}

QuizAnswer.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  image: { type: DataTypes.TEXT },
  correct: { type: DataTypes.TINYINT },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: "QuizAnswer",
  tableName: "quizzes_questions_answers",
  timestamps: false,
});

module.exports = QuizAnswer;
