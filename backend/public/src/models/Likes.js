const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Like extends Model {}

Like.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: { // ✅ Assurez-vous que c'est bien `user_id` et non `userId`
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    video_id: { // ✅ Pareil ici, `video_id` et non `videoId`
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "videos",
        key: "id",
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Like",
    tableName: "likes",
    timestamps: true,
    underscored: true, // ✅ Utilise `snake_case` pour tous les champs
    indexes: [
      {
        unique: true,
        fields: ["user_id", "video_id"],
      },
    ],
  }
);

module.exports = Like;
