const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class UserMatiere extends Model {}

UserMatiere.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  matiere_id: { type: DataTypes.INTEGER, allowNull: false },
  teacher_id: { type: DataTypes.INTEGER, allowNull: false },
  level_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: "UserMatiere",
  tableName: "user_matiere",
  timestamps: false,
});

module.exports = UserMatiere;
