const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizResult extends Model {}

QuizResult.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quiz_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  results: {
    type: DataTypes.JSON,
    allowNull: false,
},
  user_grade: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM("passed", "failed", "waiting") },
  created_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: "QuizResult",
  tableName: "quizzes_results",
  timestamps: false,
});

module.exports = QuizResult;
