const { v4: uuidv4 } = require('uuid');
const db = require('../models');

class RecommendationHistoryService {
  /**
   * Enregistre une nouvelle recommandation dans l'historique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type de recommandation ('teacher', 'exercise', 'course')
   * @param {Array} recommendationList - Liste complète des recommandations
   * @param {string} matiereName - Nom de la matière
   * @param {number} levelId - ID du niveau
   * @returns {Promise<Object>} Session créée
   */
  static async saveRecommendation(userId, type, recommendationList, matiereName = null, levelId = null) {
    try {
      const sessionRequestId = uuidv4();
      
      const recommendation = await db.RecommendationHistory.create({
        user_id: userId,
        recommendation_type: type,
        session_request_id: sessionRequestId,
        matiere_name: matiereName,
        level_id: levelId,
        recommendation_list: recommendationList,
        shown_items: [],
        timestamp: new Date()
      });

      console.log(`✅ Recommandation sauvegardée: ${sessionRequestId} pour l'utilisateur ${userId} (${type})`);
      return recommendation;
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde de la recommandation: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupère l'historique des recommandations pour un utilisateur et un type donné
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type de recommandation
   * @param {number} limitDays - Limite en jours pour l'historique (défaut: 7)
   * @returns {Promise<Array>} Historique des recommandations
   */
  static async getRecommendationHistory(userId, type, limitDays = 7) {
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - limitDays);

      const history = await db.RecommendationHistory.findAll({
        where: {
          user_id: userId,
          recommendation_type: type,
          timestamp: {
            [db.Sequelize.Op.gte]: limitDate
          }
        },
        order: [['timestamp', 'DESC']]
      });

      return history;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération de l'historique: ${error.message}`);
      return [];
    }
  }

  /**
   * Récupère tous les éléments déjà montrés à un utilisateur pour un type donné
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type de recommandation
   * @param {number} limitDays - Limite en jours pour l'historique (défaut: 7)
   * @returns {Promise<Array>} Liste des IDs déjà montrés
   */
  static async getShownItems(userId, type, limitDays = 7) {
    try {
      const history = await this.getRecommendationHistory(userId, type, limitDays);
      
      const shownItems = [];
      history.forEach(record => {
        if (record.shown_items && Array.isArray(record.shown_items)) {
          shownItems.push(...record.shown_items);
        }
      });

      // Retourner les IDs uniques
      return [...new Set(shownItems)];
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des éléments montrés: ${error.message}`);
      return [];
    }
  }

  /**
   * Marque un élément comme montré à l'utilisateur
   * @param {string} sessionRequestId - ID de la session de recommandation
   * @param {number|string} itemId - ID de l'élément montré
   * @returns {Promise<boolean>} Succès de l'opération
   */
  static async markItemAsShown(sessionRequestId, itemId) {
    try {
      const recommendation = await db.RecommendationHistory.findOne({
        where: { session_request_id: sessionRequestId }
      });

      if (!recommendation) {
        console.error(`❌ Session de recommandation non trouvée: ${sessionRequestId}`);
        return false;
      }

      const shownItems = recommendation.shown_items || [];
      if (!shownItems.includes(itemId)) {
        shownItems.push(itemId);
        recommendation.shown_items = shownItems;
        await recommendation.save();
        
        console.log(`✅ Élément ${itemId} marqué comme montré dans la session ${sessionRequestId}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Erreur lors du marquage de l'élément comme montré: ${error.message}`);
      return false;
    }
  }

  /**
   * Trouve le prochain élément à montrer à partir d'une liste de recommandations
   * @param {Array} newRecommendationList - Nouvelle liste de recommandations
   * @param {Array} shownItems - Liste des éléments déjà montrés
   * @returns {Object|null} Prochain élément à montrer ou null si aucun
   */
  static findNextItemToShow(newRecommendationList, shownItems) {
    try {
      if (!Array.isArray(newRecommendationList) || newRecommendationList.length === 0) {
        return null;
      }

      // Chercher le premier élément non encore montré
      for (const item of newRecommendationList) {
        const itemId = item.id || item.video_id || item.webinar_id || item.teacher_id;
        if (itemId && !shownItems.includes(itemId)) {
          return item;
        }
      }

      return null; // Tous les éléments ont déjà été montrés
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche du prochain élément: ${error.message}`);
      return null;
    }
  }

  /**
   * Nettoie l'historique ancien (plus de X jours)
   * @param {number} daysToKeep - Nombre de jours à conserver (défaut: 30)
   * @returns {Promise<number>} Nombre d'enregistrements supprimés
   */
  static async cleanOldHistory(daysToKeep = 30) {
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysToKeep);

      const deletedCount = await db.RecommendationHistory.destroy({
        where: {
          timestamp: {
            [db.Sequelize.Op.lt]: limitDate
          }
        }
      });

      console.log(`✅ ${deletedCount} anciens enregistrements d'historique supprimés`);
      return deletedCount;
    } catch (error) {
      console.error(`❌ Erreur lors du nettoyage de l'historique: ${error.message}`);
      return 0;
    }
  }
}

module.exports = RecommendationHistoryService;
