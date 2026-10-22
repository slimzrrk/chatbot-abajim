const db = require('../models');
const { Op } = require('sequelize');

/**
 * Récupère l'historique complet d'un utilisateur depuis la base de données
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @returns {Promise<Array>} - Liste des messages formatés pour GPT
 */
const getHistory = async (userId) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 heure en arrière
    console.log("🕐 Heure actuelle :", new Date());
    console.log("📉 Filtrage à partir de :", oneHourAgo);

    const historyRecords = await db.ChatbotInteraction.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gte]: oneHourAgo }
      },
      order: [['created_at', 'ASC']],
      limit: 15 // Augmenter la limite pour s'assurer d'avoir les interactions récentes
    });

    console.log("📚 Résultats historiques :", historyRecords.map(h => h.created_at));

    if (!Array.isArray(historyRecords)) {
      console.error("❌ L'historique n'est pas un tableau valide.");
      return [];
    }

    // Construire l'historique en ajoutant séparément chaque message et réponse
    const history = [];
    let lastValidMessage = {};

    historyRecords.forEach(record => {
      if (record.message) {
        history.push({
          role: 'user',
          content: record.message
        });
      }
      if (record.response) {
        history.push({
          role: 'assistant',
          content: record.response
        });
      }
    
      // 🧠 On complète lastValidMessage avec des champs non nuls uniquement
      // Préserver les valeurs existantes et ne les remplacer que si de nouvelles valeurs sont disponibles
      if (record.matiere && record.matiere !== null) {
        lastValidMessage.matiere = record.matiere;
      }
      if (record.niveau && record.niveau !== null) {
        lastValidMessage.niveau = record.niveau;
      }
      if (record.manuelName && record.manuelName !== null) {
        lastValidMessage.manuelName = record.manuelName;
      }
      if (record.page && record.page !== null) {
        lastValidMessage.page = record.page;
      }
      if (record.teacherFirstName && record.teacherFirstName !== null) {
        lastValidMessage.teacherFirstName = record.teacherFirstName;
      }
      if (record.teacherLastName && record.teacherLastName !== null) {
        lastValidMessage.teacherLastName = record.teacherLastName;
      }
    });


    return { history, lastValidMessage };


  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'historique :", error.message);
    return { history: [], lastValidMessage: {} };
  }
};

/**
 * Enregistre un nouveau message dans l'historique de l'utilisateur
 * @param {string} userId - Identifiant unique de l'utilisateur
 * @param {string} message - Message de l'utilisateur
 * @param {string} response - Réponse du chatbot
 */
const addToHistory = async (userId, message, response) => {
  await db.ChatbotInteraction.create({
    user_id: userId,
    message,
    response,
    created_at: new Date()
  });
};

module.exports = { getHistory, addToHistory };
