/**
 * Recommendation service for Abajim.
 * This service provides teacher recommendations based on subject and level.
 * It uses the recommendation API to get recommendations.
 */

const axios = require('axios');
const logger = require('../config/logger');

// Configuration de l'API de recommandation
const RECOMMENDATION_API_URL = process.env.RECOMMENDATION_API_URL || 'http://localhost:8000/api';
logger.info(`Using recommendation API URL: ${RECOMMENDATION_API_URL}`);

/**
 * Get teacher recommendations for a student.
 *
 * @param {number} childId - Student ID
 * @param {string} matiereName - Subject name
 * @param {number} levelId - Level ID
 * @param {number} [topN=5] - Number of recommendations to return
 * @returns {Promise<Array>} - List of recommended teachers
 */
async function recommendProf(childId, matiereName, levelId, topN = 5) {
  logger.info(`Getting teacher recommendations for student ${childId}, subject '${matiereName}', level ${levelId}`);

  try {
    // Construire l'URL de l'API
    const url = `${RECOMMENDATION_API_URL}/recommendations/teachers`;

    // Construire les paramètres de la requête
    const params = {
      matiere_name: matiereName,
      level_id: levelId,
      top_n: topN
    };

    // Ajouter l'ID de l'étudiant s'il est fourni
    if (childId) {
      params.student_id = childId;
    }

    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const response = await axios.get(url, {
      params,
      timeout: 5000 // 5 secondes de timeout
    });

    // Vérifier la réponse
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    // Récupérer les recommandations
    const responseData = response.data;
    logger.info(`Raw API response: ${JSON.stringify(responseData)}`);

    // Vérifier si les recommandations sont dans le format attendu
    if (!responseData) {
      logger.error(`Empty response from API`);
      return [];
    }

    // Si la réponse est déjà au format attendu
    if (responseData.recommendations && Array.isArray(responseData.recommendations)) {
      const recommendations = responseData.recommendations;
      logger.info(`Found ${recommendations.length} teacher recommendations`);
      return recommendations;
    }
    // Si la réponse est un tableau (ancien format)
    else if (Array.isArray(responseData)) {
      logger.info(`Found ${responseData.length} teacher recommendations (array format)`);
      return responseData;
    }
    // Format inconnu
    else {
      logger.error(`Invalid response format: ${JSON.stringify(responseData)}`);
      return [];
    }
  } catch (error) {
    logger.error(`Error getting teacher recommendations: ${error.message}`);

    if (error.response) {
      logger.error(`API response status: ${error.response.status}`);
      logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logger.error(`No response received: ${error.request}`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.error('Recommendation API is not available. Make sure it is running.');
    }

    return [];
  }
}

/**
 * Get exercise recommendations for a student.
 *
 * @param {number} childId - Student ID
 * @param {string} matiereName - Subject name
 * @param {number} [levelId=null] - Level ID (optional, will be retrieved from user if not provided)
 * @param {number} [topN=5] - Number of recommendations to return
 * @returns {Promise<Object>} - Object with recommendations array
 */
async function recommendExercisesByManuel(childId, matiereName, levelId = null, topN = 5) {
  logger.info(`Getting exercise recommendations for student ${childId}, subject '${matiereName}', level ${levelId}`);

  try {
    // Si le niveau n'est pas fourni, le récupérer depuis la base de données
    if (!levelId) {
      const db = require('../models');
      const user = await db.User.findByPk(childId);

      if (!user || !user.level_id) {
        logger.error(`User ${childId} not found or has no level_id`);
        return { recommendations: [] };
      }

      levelId = user.level_id;
    }

    // Construire l'URL de l'API
    const url = `${RECOMMENDATION_API_URL}/recommendations/exercises`;

    // Construire les paramètres de la requête
    const params = {
      student_id: childId,
      matiere_name: matiereName,
      level_id: levelId,
      top_n: topN
    };

    logger.info(`Calling recommendation API with params: ${JSON.stringify(params)}`);

    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const response = await axios.get(url, {
      params,
      timeout: 10000 // 10 secondes de timeout
    });

    // Vérifier la réponse
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    // Récupérer les recommandations
    const responseData = response.data;
    logger.info(`Raw API response: ${JSON.stringify(responseData)}`);

    // Vérifier si les recommandations sont dans le format attendu
    if (!responseData) {
      logger.error(`Empty response from API`);
      return { recommendations: [] };
    }

    // Si la réponse est déjà au format attendu
    if (responseData.recommendations && Array.isArray(responseData.recommendations)) {
      const recommendations = responseData.recommendations;
      logger.info(`Found ${recommendations.length} exercise recommendations`);

      // Formater les recommandations pour le frontend
      const formattedRecommendations = recommendations.map(exercise => {
        // Utiliser le titre complet (titleAll) ou créer un titre descriptif
        let title = exercise.titre; // Le service Python retourne maintenant titleAll dans le champ titre

        if (!title || title.trim() === '') {
          // Construire un titre basé sur les informations disponibles
          const matiere = exercise.material_name || exercise.manuel_name || 'المادة';
          const page = exercise.page ? ` - صفحة ${exercise.page}` : '';
          title = `تمرين في ${matiere}${page}`;
        }

        return {
          id: exercise.id,
          title: title,
          description: exercise.description || '',
          thumbnail: exercise.thumbnail || null,
          video_url: exercise.video || exercise.lien,
          page: exercise.page || null,
          manuel_id: exercise.manuel_id || null,
          manuel_name: exercise.manuel_name || null,
          teacher_id: exercise.user_id || null,
          teacher_name: exercise.teacher_name || null,
          teacher: exercise.teacher || null,
          views: exercise.vues || 0,
          likes: exercise.likes || 0,
          score: exercise.score || 0
        };
      });

      return { recommendations: formattedRecommendations };
    }
    // Si la réponse contient directement un tableau de recommandations
    else if (responseData.count !== undefined && Array.isArray(responseData.recommendations)) {
      const recommendations = responseData.recommendations;
      logger.info(`Found ${recommendations.length} exercise recommendations (count format)`);

      // Formater les recommandations pour le frontend
      const formattedRecommendations = recommendations.map(exercise => ({
        id: exercise.id,
        title: exercise.titre || 'تمرين بدون عنوان',
        description: exercise.description || '',
        thumbnail: exercise.thumbnail || null,
        video_url: exercise.video || exercise.lien,
        page: exercise.page || null,
        manuel_id: exercise.manuel_id || null,
        manuel_name: exercise.manuel_name || null,
        teacher_id: exercise.user_id || null,
        teacher_name: exercise.teacher_name || null,
        views: exercise.vues || 0,
        likes: exercise.likes || 0,
        score: exercise.score || 0
      }));

      return { recommendations: formattedRecommendations };
    }
    // Si la réponse est un tableau (ancien format)
    else if (Array.isArray(responseData)) {
      logger.info(`Found ${responseData.length} exercise recommendations (array format)`);

      // Formater les recommandations pour le frontend
      const formattedRecommendations = responseData.map(exercise => ({
        id: exercise.id,
        title: exercise.titre || 'تمرين بدون عنوان',
        description: exercise.description || '',
        thumbnail: exercise.thumbnail || null,
        video_url: exercise.video || exercise.lien,
        page: exercise.page || null,
        manuel_id: exercise.manuel_id || null,
        manuel_name: exercise.manuel_name || null,
        teacher_id: exercise.user_id || null,
        teacher_name: exercise.teacher_name || null,
        views: exercise.vues || 0,
        likes: exercise.likes || 0,
        score: exercise.score || 0
      }));

      return { recommendations: formattedRecommendations };
    }
    // Format inconnu
    else {
      logger.error(`Invalid response format: ${JSON.stringify(responseData)}`);
      return { recommendations: [] };
    }
  } catch (error) {
    logger.error(`Error in recommendExercisesByManuel: ${error.message}`);

    if (error.response) {
      logger.error(`API response status: ${error.response.status}`);
      logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logger.error(`No response received: ${error.request}`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      logger.error('Recommendation API is not available. Make sure it is running.');
    }

    return { recommendations: [] };
  }
}

// /**
//  * Get course recommendations for a student.
//  *
//  * @param {number} childId - Student ID
//  * @param {string} matiereName - Subject name
//  * @param {number} [topN=5] - Number of recommendations to return
//  * @returns {Promise<Array>} - List of recommended courses
//  */
// async function recommendCourses(childId, matiereName, topN = 5) {
//   logger.info(`Getting course recommendations for student ${childId}, subject '${matiereName}'`);

//   try {
//     // Récupérer le niveau de l'étudiant depuis la base de données
//     const db = require('../models');
//     const user = await db.User.findByPk(childId);

//     if (!user || !user.level_id) {
//       logger.error(`User ${childId} not found or has no level_id`);
//       return [];
//     }

//     const levelId = user.level_id;

//     // Construire l'URL de l'API
//     const url = `${RECOMMENDATION_API_URL}/recommendations/courses`;

//     // Construire les paramètres de la requête
//     const params = {
//       student_id: childId,
//       matiere_name: matiereName,
//       level_id: levelId,
//       top_n: topN
//     };

//     // Appeler l'API de recommandation
//     const response = await axios.get(url, { params });

//     // Vérifier la réponse
//     if (response.status !== 200) {
//       throw new Error(`API returned status ${response.status}: ${response.statusText}`);
//     }

//     // Récupérer les recommandations
//     const recommendations = response.data;

//     logger.info(`Found ${recommendations.length} course recommendations`);
//     return recommendations;
//   } catch (error) {
//     logger.error(`Error getting course recommendations: ${error.message}`);

//     // Si l'API n'est pas disponible ou si la fonctionnalité n'est pas implémentée, retourner un tableau vide
//     if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' ||
//         (error.response && error.response.status === 501)) {
//       logger.error('Course recommendation API is not available or not implemented yet.');
//       return [];
//     }

//     throw error;
//   }
// }

/**
 * Check if the recommendation API is available.
 *
 * @returns {Promise<boolean>} - True if the API is available, false otherwise
 */
async function isApiAvailable() {
  try {
    const response = await axios.get(`${RECOMMENDATION_API_URL.replace(/\/api$/, '')}/health`);
    return response.status === 200 && response.data.status === 'ok';
  } catch (error) {
    logger.error(`Error checking API availability: ${error.message}`);
    return false;
  }
}

/**
 * Get course recommendations for a student.
 *
 * @param {number} childId - Student ID
 * @param {string} matiereName - Subject name
 * @param {number} [levelId=null] - Level ID (optional, will be retrieved from user if not provided)
 * @param {number} [topN=5] - Number of recommendations to return
 * @returns {Promise<Object>} - Object with recommendations array
 */
async function recommendCourses(childId, matiereName, levelId = null, topN = 5) {
  logger.info(`Getting course recommendations for student ${childId}, subject '${matiereName}', level ${levelId}`);

  try {
    // Si le niveau n'est pas fourni, le récupérer depuis la base de données
    if (!levelId) {
      const db = require('../models');
      const user = await db.User.findByPk(childId);

      if (!user || !user.level_id) {
        logger.error(`User ${childId} not found or has no level_id`);
        return { recommendations: [] };
      }

      levelId = user.level_id;
    }

    // Construire l'URL de l'API
    const url = `${RECOMMENDATION_API_URL}/recommendations/courses`;

    // Construire les paramètres de la requête
    const params = {
      student_id: childId,
      matiere_name: matiereName,
      level_id: levelId,
      top_n: topN
    };

    // Ajouter un timeout pour éviter que la requête ne reste bloquée
    const response = await axios.get(url, {
      params,
      timeout: 5000 // 5 secondes de timeout
    });

    // Vérifier la réponse
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }

    // Récupérer les recommandations
    const data = response.data;
    const recommendations = data.recommendations || [];

    logger.info(`Received ${recommendations.length} course recommendations`);

    // Formater les recommandations pour le frontend
    const formattedRecommendations = recommendations.map(course => ({
      id: course.id,
      title: course.title || 'دورة بدون عنوان',
      slug: course.slug,
      image_cover: course.image_cover,
      thumbnail: course.thumbnail || null,
      price: course.price || 0,
      duration: course.duration,
      type: course.type || 'course',
      status: course.status,
      description: course.description,
      teacher: {
        id: course.teacher?.id || null,
        full_name: course.teacher?.full_name || 'مدرس غير معروف',
        avatar: course.teacher?.avatar || '/default-avatar.jpg'
      },
      translations: course.translations || [],
      chapters: course.chapters || [],
      score: course.score || 0,
      matched_with_previous_content: course.matched_with_previous_content || false,
      isAccessible: course.isAccessible !== undefined ? course.isAccessible : true,
      isFavorite: course.isFavorite || false
    }));

    return { recommendations: formattedRecommendations };
  } catch (error) {
    // Gérer les erreurs
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.error(`Connection to recommendation API failed: ${error.message}`);
      return { recommendations: [] };
    }

    if (error.response && error.response.status === 501) {
      logger.warn('Course recommendation feature is not implemented yet');
      return { recommendations: [] };
    }

    logger.error(`Error in recommendCourses: ${error.message}`);
    return { recommendations: [] };
  }
}

module.exports = {
  recommendProf,
  recommendExercisesByManuel,
  recommendCourses,
  isApiAvailable
};
