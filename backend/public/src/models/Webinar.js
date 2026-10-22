const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Webinar extends Model {}

Webinar.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teacher_id: { type: DataTypes.INTEGER, allowNull: false },
    creator_id: { type: DataTypes.INTEGER, allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      type: DataTypes.ENUM("webinar", "course", "text_lesson"),
      allowNull: false,
    },
    private: { type: DataTypes.BOOLEAN, defaultValue: false },
    slug: { type: DataTypes.STRING, allowNull: true },
    start_date: { type: DataTypes.DATE, allowNull: true },
    duration: { type: DataTypes.INTEGER, allowNull: true },
    image_cover: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.ENUM("active", "pending", "is_draft", "inactive"),
      allowNull: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
    level_id: { type: DataTypes.INTEGER, allowNull: true },
    matiere_id: { type: DataTypes.INTEGER, allowNull: true },
    seo_description: { type: DataTypes.STRING(128), allowNull: true },
    thumbnail: { type: DataTypes.STRING, allowNull: true },
    video_demo: { type: DataTypes.STRING, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    support: { type: DataTypes.BOOLEAN, defaultValue: false },
    downloadable: { type: DataTypes.BOOLEAN, defaultValue: false },
    partner_instructor: { type: DataTypes.BOOLEAN, defaultValue: false },
    subscribe: { type: DataTypes.BOOLEAN, defaultValue: false },
    forum: { type: DataTypes.BOOLEAN, defaultValue: false },
    access_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Number of days to access the course",
    },
    points: { type: DataTypes.INTEGER, allowNull: true },
    message_for_reviewer: { type: DataTypes.TEXT, allowNull: true },
    submaterial_id: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: "Webinar",
    tableName: "webinars",
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

module.exports = Webinar;
