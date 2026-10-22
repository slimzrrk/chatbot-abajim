const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); // Import de l'instance Sequelize

const ChatbotRecommendation = sequelize.define(
  "chatbot_recommendations",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Identifiant unique de la session de recommandation",
    },
    recommendation_type: {
      type: DataTypes.ENUM("teacher", "course", "exercise"),
      allowNull: false,
      comment: "Type de recommandation (professeur, cours, exercice)",
    },
    recommendations_data: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      comment: "Données JSON des recommandations",
      get() {
        const rawValue = this.getDataValue('recommendations_data');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('recommendations_data', JSON.stringify(value));
      }
    },
    current_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Index actuel dans la liste des recommandations",
    },
    matiere_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Nom de la matière concernée par les recommandations",
    },
    level_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID du niveau scolaire concerné par les recommandations",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    freezeTableName: true, // Évite la pluralisation du nom de la table
  }
);

module.exports = ChatbotRecommendation;
