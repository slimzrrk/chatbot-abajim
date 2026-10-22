const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ChatbotInteraction = sequelize.define(
  "chatbot_interactions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true, // 🔧 ICI : permettre null temporairement
    },
    tts: {
      type: DataTypes.STRING,
      allowNull: true
    },
    message_type: {
      type: DataTypes.ENUM('text', 'audio', 'welcome'),
      allowNull: false,
      defaultValue: 'text'
    },
    audio_path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Chemin vers le fichier audio du message utilisateur'
    },
    audio_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Durée du message audio en millisecondes'
    },
    audio_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Taille du fichier audio en bytes'
    },
    intent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    matiere: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    niveau: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    manuelName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    page: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    teacherFirstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    teacherLastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    freezeTableName: true,
  }
);

module.exports = ChatbotInteraction;
