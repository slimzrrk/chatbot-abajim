"""
Module principal de recommandation de cours (webinaires).
"""

import logging
from sqlalchemy import or_, and_, func, desc

from recommendation_service.common.db_connector import get_db_session, close_db_session
from recommendation_service.common.config import DEFAULT_TOP_N, MANUAL_LEVEL_MAPPING, ACTIVE_STATUS
from recommendation_service.models import (
    Webinar, WebinarTranslation, WebinarChapter, File, User, Material, 
    Follow, UserView, UserMinWatched, UserLevel
)
from recommendation_service.courses.filters import filter_webinars_by_subject_and_level, filter_unseen_webinars
from recommendation_service.courses.scoring import calculate_webinar_score, calculate_similarity_score, find_similar_users
from recommendation_service.courses.cold_start import handle_course_cold_start
from recommendation_service.utils.manual_finder import get_matiere_id_from_name

logger = logging.getLogger(__name__)

def recommend_courses(user_id, matiere_name=None, level_id=None, limit=DEFAULT_TOP_N):
    """
    Recommande des cours (webinaires) pour un utilisateur.
    
    Args:
        user_id (int): ID de l'utilisateur
        matiere_name (str, optional): Nom de la matière pour filtrer les recommandations
        level_id (int, optional): ID du niveau pour filtrer les recommandations
        limit (int, optional): Nombre de recommandations à retourner
        
    Returns:
        tuple: (liste d'objets Webinar recommandés, liste des scores correspondants)
    """
    logger.info(f"Recommending courses for user {user_id}, matiere={matiere_name}, level_id={level_id}")
    
    # Obtenir une session de base de données
    session = get_db_session()
    
    try:
        # Étape 1: Récupérer le niveau de l'utilisateur s'il n'est pas fourni
        if not level_id:
            user_level = session.query(UserLevel).filter_by(user_id=user_id).first()
            if user_level:
                level_id = user_level.level_id
                logger.info(f"Found user level: {level_id}")
            else:
                logger.warning(f"No level found for user {user_id}")
                # Utiliser le cold start si aucun niveau n'est trouvé
                return handle_course_cold_start(session, matiere_name=matiere_name, limit=limit)
        
        # Étape 2: Récupérer l'ID de la matière à partir du nom
        matiere_id = None
        if matiere_name:
            matiere_id = get_matiere_id_from_name(matiere_name, level_id, session)
            logger.info(f"Found matiere_id: {matiere_id} for matiere_name: {matiere_name}")
        
        # Étape 3: Filtrer les webinaires par matière et niveau
        webinars = filter_webinars_by_subject_and_level(session, matiere_id, level_id)
        logger.info(f"Found {len(webinars)} webinars matching subject and level")
        
        if not webinars:
            logger.warning(f"No webinars found for matiere_id={matiere_id}, level_id={level_id}")
            return handle_course_cold_start(session, matiere_id=matiere_id, matiere_name=matiere_name, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 4: Filtrer les webinaires déjà vus par l'utilisateur
        webinars = filter_unseen_webinars(session, webinars, user_id)
        logger.info(f"Found {len(webinars)} unseen webinars")
        
        if not webinars:
            logger.warning(f"No unseen webinars found for user {user_id}")
            return handle_course_cold_start(session, matiere_id=matiere_id, matiere_name=matiere_name, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 5: Trouver des utilisateurs similaires
        similar_users = find_similar_users(session, user_id)
        logger.info(f"Found {len(similar_users)} similar users")
        
        # Étape 6: Calculer le score pour chaque webinaire
        scored_webinars = []
        
        for webinar in webinars:
            # Calculer le score de base
            base_score = calculate_webinar_score(session, webinar, user_id)
            
            # Calculer le score de similarité
            similarity_score = calculate_similarity_score(session, webinar, similar_users)
            
            # Calculer le score total
            total_score = base_score + similarity_score
            
            scored_webinars.append((webinar, total_score))
            logger.debug(f"Webinar {webinar.id}: base_score={base_score}, similarity_score={similarity_score}, total_score={total_score}")
        
        # Étape 7: Trier par score décroissant
        scored_webinars.sort(key=lambda x: x[1], reverse=True)
        
        # Étape 8: Retourner les top N recommandations
        top_webinars = scored_webinars[:limit]
        
        if not top_webinars:
            logger.warning("No webinars to recommend")
            # Utiliser le cold start si aucun webinaire n'est recommandé
            return handle_course_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        recommended_webinars, scores = zip(*top_webinars)
        logger.info(f"Returning {len(recommended_webinars)} recommended webinars")
        
        return recommended_webinars, scores
    
    finally:
        # Fermer la session de base de données
        close_db_session(session)
