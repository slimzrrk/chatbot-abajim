const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import de l'instance Sequelize

const ChatbotTrainingData = sequelize.define(
  "chatbot_training_data",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    input_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Message d'entrée utilisé comme exemple d'entraînement",
    },
    expected_response: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Réponse attendue pour l'entraînement supervisé",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    freezeTableName: true, // Garde le nom de table "chatbot_training_data"
  }
);

module.exports = ChatbotTrainingData;
