'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('chatbot_interactions');

    // Ajouter les champs pour les messages vocaux seulement s'ils n'existent pas
    if (!tableDescription.message_type) {
      await queryInterface.addColumn('chatbot_interactions', 'message_type', {
        type: Sequelize.ENUM('text', 'audio'),
        allowNull: false,
        defaultValue: 'text'
      });
    }

    if (!tableDescription.audio_path) {
      await queryInterface.addColumn('chatbot_interactions', 'audio_path', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Chemin vers le fichier audio du message utilisateur'
      });
    }

    if (!tableDescription.audio_duration) {
      await queryInterface.addColumn('chatbot_interactions', 'audio_duration', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Durée du message audio en millisecondes'
      });
    }

    if (!tableDescription.audio_size) {
      await queryInterface.addColumn('chatbot_interactions', 'audio_size', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Taille du fichier audio en bytes'
      });
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('chatbot_interactions', 'message_type');
    await queryInterface.removeColumn('chatbot_interactions', 'audio_path');
    await queryInterface.removeColumn('chatbot_interactions', 'audio_duration');
    await queryInterface.removeColumn('chatbot_interactions', 'audio_size');
  }
};
