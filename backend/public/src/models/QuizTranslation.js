const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class QuizTranslation extends Model {}

QuizTranslation.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  quiz_id: { type: DataTypes.INTEGER, allowNull: false },
  locale: { type: DataTypes.STRING },
  title: { type: DataTypes.TEXT },
}, {
  sequelize,
  modelName: "QuizTranslation",
  tableName: "quiz_translations",
  timestamps: false,
});

module.exports = QuizTranslation;
