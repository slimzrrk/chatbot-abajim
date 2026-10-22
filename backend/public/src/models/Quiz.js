const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Quiz extends Model {}

Quiz.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  webinar_id: { type: DataTypes.INTEGER, allowNull: true },
  creator_id: { type: DataTypes.INTEGER, allowNull: false },
  chapter_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING },
  webinar_title: { type: DataTypes.STRING },
  time: { type: DataTypes.INTEGER, allowNull: true },
  attempt: { type: DataTypes.INTEGER, allowNull: true },
  pass_mark: { type: DataTypes.INTEGER, allowNull: true },
  certificate: { type: DataTypes.TINYINT, allowNull: true },
  status: { type: DataTypes.ENUM("active", "inactive"), defaultValue: "active" },
  total_mark: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
}, {
  sequelize,
  modelName: "Quiz",
  tableName: "quizzes",
  timestamps: false,
});

module.exports = Quiz;
