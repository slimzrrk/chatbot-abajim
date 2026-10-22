const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizQuestion extends Model {}

QuizQuestion.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quiz_id: { type: DataTypes.INTEGER, allowNull: false },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  grade: { type: DataTypes.STRING },
  type: { type: DataTypes.ENUM("multiple", "descriptive") },
  image: { type: DataTypes.TEXT },
  video: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: "QuizQuestion",
  tableName: "quizzes_questions",
  timestamps: false,
});

module.exports = QuizQuestion;
