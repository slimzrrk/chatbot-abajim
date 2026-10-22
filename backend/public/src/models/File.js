const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class File extends Model {}

File.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    creator_id: { type: DataTypes.INTEGER, allowNull: false },
    webinar_id: { type: DataTypes.INTEGER, allowNull: true },
    chapter_id: { type: DataTypes.INTEGER, allowNull: true },
    accessibility: { type: DataTypes.STRING, allowNull: true }, 
    downloadable: { type: DataTypes.BOOLEAN, defaultValue: false },
    storage: { type: DataTypes.STRING, allowNull: true }, 
    file: { type: DataTypes.STRING, allowNull: false }, 
    volume: { type: DataTypes.STRING, allowNull: true }, 
    file_type: { type: DataTypes.STRING, allowNull: true },
    interactive_type: { type: DataTypes.STRING, allowNull: true },
    interactive_file_name: { type: DataTypes.STRING, allowNull: true },
    interactive_file_path: { type: DataTypes.STRING, allowNull: true },
    check_previous_parts: { type: DataTypes.INTEGER, defaultValue: 0 },
    access_after_day: { type: DataTypes.INTEGER, allowNull: true },
    online_viewer: { type: DataTypes.BOOLEAN, defaultValue: false },
    order: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "File",
    tableName: "files",
    timestamps: false, // les timestamps sont déjà définis en colonnes
    underscored: true,
    paranoid: false,
  }
);

module.exports = File;
