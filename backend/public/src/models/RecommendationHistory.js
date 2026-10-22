const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RecommendationHistory = sequelize.define('RecommendationHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'utilisateur qui a reçu la recommandation'
  },
  recommendation_type: {
    type: DataTypes.ENUM('teacher', 'exercise', 'course'),
    allowNull: false,
    comment: 'Type de recommandation (professeur, exercice, cours)'
  },
  session_request_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Identifiant unique de la requête de recommandation'
  },
  matiere_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nom de la matière concernée par la recommandation'
  },
  level_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID du niveau scolaire concerné par la recommandation'
  },
  recommendation_list: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Liste complète des recommandations retournées par le moteur (JSON)',
    get() {
      const rawValue = this.getDataValue('recommendation_list');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('recommendation_list', JSON.stringify(value));
    }
  },
  shown_items: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Liste des éléments déjà montrés à l\'utilisateur (JSON)',
    get() {
      const rawValue = this.getDataValue('shown_items');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('shown_items', JSON.stringify(value));
    }
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Horodatage de la recommandation'
  }
}, {
  tableName: 'recommendation_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id', 'recommendation_type']
    },
    {
      fields: ['session_request_id']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = RecommendationHistory;
