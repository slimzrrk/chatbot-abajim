/**
 * Controller for recommendation endpoints.
 * This controller exposes the recommendation service via REST API.
 */

const RecommendationService = require('../services/RecommendationService');
const logger = require('../config/logger');

/**
 * Get teacher recommendations for a student.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTeacherRecommendations = async (req, res) => {
  try {
    const { userId, matiereName, levelId, topN } = req.query;

    // Vérifier les paramètres obligatoires
    if (!matiereName) {
      return res.status(400).json({ error: 'Missing required parameter: matiereName' });
    }

    // Convertir les paramètres numériques
    const studentId = userId ? parseInt(userId) : null;
    const level = levelId ? parseInt(levelId) : null;
    const limit = topN ? parseInt(topN) : 5;

    // Vérifier si l'API de recommandation est disponible
    const apiAvailable = await RecommendationService.isApiAvailable();
    if (!apiAvailable) {
      return res.status(503).json({
        error: 'Recommendation service unavailable',
        message: 'The recommendation service is currently unavailable. Please try again later.'
      });
    }

    // Obtenir les recommandations
    const recommendations = await RecommendationService.recommendProf(studentId, matiereName, level, limit);

    // Retourner les recommandations
    return res.json(recommendations);
  } catch (error) {
    logger.error(`Error in getTeacherRecommendations: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Get exercise recommendations for a student.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExerciseRecommendations = async (req, res) => {
  try {
    const { userId, matiereName, levelId, topN } = req.query;

    // Vérifier les paramètres obligatoires
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    if (!matiereName) {
      return res.status(400).json({ error: 'Missing required parameter: matiereName' });
    }

    // Convertir les paramètres numériques
    const studentId = parseInt(userId);
    const level = levelId ? parseInt(levelId) : null;
    const limit = topN ? parseInt(topN) : 5;

    // Vérifier si l'API de recommandation est disponible
    const apiAvailable = await RecommendationService.isApiAvailable();
    if (!apiAvailable) {
      return res.status(503).json({
        error: 'Recommendation service unavailable',
        message: 'The recommendation service is currently unavailable. Please try again later.'
      });
    }

    // Obtenir les recommandations
    try {
      logger.info(`Calling RecommendationService.recommendExercisesByManuel with params: studentId=${studentId}, matiereName=${matiereName}, level=${level}, limit=${limit}`);
      const recommendations = await RecommendationService.recommendExercisesByManuel(studentId, matiereName, level, limit);
      logger.info(`Got recommendations: ${JSON.stringify(recommendations)}`);

      // Retourner les recommandations
      return res.json(recommendations);
    } catch (error) {
      logger.error(`Error in getExerciseRecommendations when calling service: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  } catch (error) {
    logger.error(`Error in getExerciseRecommendations: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// /**
//  * Get course recommendations for a student.
//  *
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
// const getCourseRecommendations = async (req, res) => {
//   try {
//     const { userId, matiereName, topN } = req.query;

//     // Vérifier les paramètres obligatoires
//     if (!userId) {
//       return res.status(400).json({ error: 'Missing required parameter: userId' });
//     }

//     if (!matiereName) {
//       return res.status(400).json({ error: 'Missing required parameter: matiereName' });
//     }

//     // Convertir les paramètres numériques
//     const studentId = parseInt(userId);
//     const limit = topN ? parseInt(topN) : 5;

//     // Vérifier si l'API de recommandation est disponible
//     const apiAvailable = await RecommendationService.isApiAvailable();
//     if (!apiAvailable) {
//       return res.status(503).json({
//         error: 'Recommendation service unavailable',
//         message: 'The recommendation service is currently unavailable. Please try again later.'
//       });
//     }

//     // Obtenir les recommandations
//     const recommendations = await RecommendationService.recommendCourses(studentId, matiereName, limit);

//     // Retourner les recommandations
//     return res.json(recommendations);
//   } catch (error) {
//     logger.error(`Error in getCourseRecommendations: ${error.message}`);
//     return res.status(500).json({ error: 'Internal server error', message: error.message });
//   }
// };

/**
 * Check if the recommendation service is available.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const checkServiceHealth = async (req, res) => {
  try {
    const apiAvailable = await RecommendationService.isApiAvailable();

    return res.json({
      status: apiAvailable ? 'ok' : 'unavailable',
      service: 'recommendation-service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error in checkServiceHealth: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

/**
 * Get course recommendations for a student.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCourseRecommendations = async (req, res) => {
  try {
    const { userId, matiereName, levelId, topN } = req.query;

    // Vérifier les paramètres obligatoires
    if (!userId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }

    if (!matiereName) {
      return res.status(400).json({ error: 'Missing required parameter: matiereName' });
    }

    // Convertir les paramètres numériques
    const studentId = parseInt(userId);
    const level = levelId ? parseInt(levelId) : null;
    const limit = topN ? parseInt(topN) : 5;

    // Vérifier si l'API de recommandation est disponible
    const apiAvailable = await RecommendationService.isApiAvailable();
    if (!apiAvailable) {
      return res.status(503).json({
        error: 'Recommendation service unavailable',
        message: 'The recommendation service is currently unavailable. Please try again later.'
      });
    }

    // Obtenir les recommandations
    logger.info(`Calling RecommendationService.recommendCourses with params: studentId=${studentId}, matiereName=${matiereName}, level=${level}, limit=${limit}`);
    const recommendations = await RecommendationService.recommendCourses(studentId, matiereName, level, limit);
    logger.info(`Got recommendations: ${JSON.stringify(recommendations)}`);

    // Retourner les recommandations
    return res.json(recommendations);
  } catch (error) {
    logger.error(`Error in getCourseRecommendations: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

module.exports = {
  getTeacherRecommendations,
  getExerciseRecommendations,
  getCourseRecommendations,
  checkServiceHealth
};