// services/ProgressiveRecommendationService.js
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
// Utiliser console au lieu de logger pour éviter les erreurs
const logger = console;

/**
 * Service pour gérer les recommandations progressives
 * Permet de stocker une liste de recommandations et de les afficher une par une
 */
class ProgressiveRecommendationService {
    /**
     * Crée une nouvelle session de recommandation
     * @param {number} userId - ID de l'utilisateur
     * @param {string} type - Type de recommandation (teacher, course, exercise)
     * @param {Array} recommendations - Liste des recommandations
     * @param {string} matiereName - Nom de la matière
     * @param {number} levelId - ID du niveau scolaire
     * @returns {Promise<Object>} - Session de recommandation créée
     */
    static async createSession(userId, type, recommendations, matiereName, levelId) {
        try {
            // Vérifier si les paramètres sont valides
            if (!userId || !type || !recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
                logger.error(`❌ Paramètres invalides pour createSession: userId=${userId}, type=${type}, recommendations.length=${recommendations?.length}`);
                return null;
            }

            // Générer un ID de session unique
            const sessionId = uuidv4();

            // Créer la session de recommandation
            const session = await db.ChatbotRecommendation.create({
                user_id: userId,
                session_id: sessionId,
                recommendation_type: type,
                recommendations_data: recommendations,
                current_index: 0,
                matiere_name: matiereName,
                level_id: levelId,
                created_at: new Date(),
                updated_at: new Date()
            });

            logger.info(`✅ Session de recommandation créée: ${sessionId} pour l'utilisateur ${userId} (${type})`);
            return session;
        } catch (error) {
            logger.error(`❌ Erreur lors de la création de la session de recommandation: ${error.message}`);
            logger.error(error.stack);
            return null;
        }
    }

    /**
     * Récupère la dernière session de recommandation active pour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} - Session de recommandation active
     */
    static async getActiveSession(userId) {
        try {
            // Récupérer la dernière session de recommandation pour cet utilisateur
            const session = await db.ChatbotRecommendation.findOne({
                where: { user_id: userId },
                order: [['created_at', 'DESC']]
            });

            if (!session) {
                logger.info(`ℹ️ Aucune session de recommandation active pour l'utilisateur ${userId}`);
                return null;
            }

            // Vérifier si la session est encore valide (moins de 30 minutes)
            const sessionTime = new Date(session.created_at).getTime();
            const currentTime = new Date().getTime();
            const sessionAge = (currentTime - sessionTime) / (1000 * 60); // en minutes

            if (sessionAge > 30) {
                logger.info(`ℹ️ Session de recommandation expirée pour l'utilisateur ${userId} (âge: ${sessionAge.toFixed(2)} minutes)`);
                return null;
            }

            return session;
        } catch (error) {
            logger.error(`❌ Erreur lors de la récupération de la session active: ${error.message}`);
            logger.error(error.stack);
            return null;
        }
    }

    /**
     * Récupère la recommandation actuelle pour une session
     * @param {Object} session - Session de recommandation
     * @returns {Object} - Recommandation actuelle
     */
    static getCurrentRecommendation(session) {
        if (!session || !session.recommendations_data || session.recommendations_data.length === 0) {
            return null;
        }

        const recommendations = session.recommendations_data;
        const currentIndex = session.current_index;

        // Vérifier si l'index est valide
        if (currentIndex >= recommendations.length) {
            return null;
        }

        return recommendations[currentIndex];
    }

    /**
     * Passe à la recommandation suivante
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} - Nouvelle recommandation ou null si plus de recommandations
     */
    static async getNextRecommendation(userId) {
        try {
            // Récupérer la session active
            const session = await this.getActiveSession(userId);
            if (!session) {
                return null;
            }

            // Vérifier s'il reste des recommandations
            const recommendations = session.recommendations_data;
            const currentIndex = session.current_index;
            const nextIndex = currentIndex + 1;

            if (nextIndex >= recommendations.length) {
                logger.info(`ℹ️ Plus de recommandations disponibles pour l'utilisateur ${userId}`);
                return { noMoreRecommendations: true };
            }

            // Mettre à jour l'index
            await session.update({
                current_index: nextIndex,
                updated_at: new Date()
            });

            logger.info(`✅ Passage à la recommandation suivante (${nextIndex + 1}/${recommendations.length}) pour l'utilisateur ${userId}`);
            return {
                recommendation: recommendations[nextIndex],
                index: nextIndex,
                total: recommendations.length,
                type: session.recommendation_type
            };
        } catch (error) {
            logger.error(`❌ Erreur lors du passage à la recommandation suivante: ${error.message}`);
            logger.error(error.stack);
            return null;
        }
    }

    /**
     * Récupère la recommandation actuelle pour un utilisateur
     * @param {number} userId - ID de l'utilisateur
     * @returns {Promise<Object>} - Recommandation actuelle
     */
    static async getCurrentRecommendationForUser(userId) {
        try {
            // Récupérer la session active
            const session = await this.getActiveSession(userId);
            if (!session) {
                return null;
            }

            // Récupérer la recommandation actuelle
            const recommendation = this.getCurrentRecommendation(session);
            if (!recommendation) {
                return null;
            }

            return {
                recommendation,
                index: session.current_index,
                total: session.recommendations_data.length,
                type: session.recommendation_type
            };
        } catch (error) {
            logger.error(`❌ Erreur lors de la récupération de la recommandation actuelle: ${error.message}`);
            logger.error(error.stack);
            return null;
        }
    }
}

module.exports = ProgressiveRecommendationService;
