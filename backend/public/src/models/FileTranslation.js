const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");

class FileTranslation extends Model {}

FileTranslation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    file_id: { type: DataTypes.INTEGER, allowNull: false },
    locale: { type: DataTypes.STRING(10), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: "FileTranslation",
    tableName: "file_translations",
    timestamps: false,
    underscored: true,
  }
);

module.exports = FileTranslation;
