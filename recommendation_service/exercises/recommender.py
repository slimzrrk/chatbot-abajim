"""
Module principal de recommandation d'exercices.
"""

import logging
from sqlalchemy import or_

from recommendation_service.common.db_connector import get_db_session, close_db_session
from recommendation_service.common.config import DEFAULT_TOP_N, MANUAL_LEVEL_MAPPING
from recommendation_service.models import Video, Manuel, Material, UserView, UserLevel
from recommendation_service.exercises.filters import filter_videos_by_subject_and_level, filter_unseen_videos
from recommendation_service.exercises.scoring import calculate_video_score, calculate_similarity_score, find_similar_users
from recommendation_service.exercises.cold_start import handle_exercise_cold_start

logger = logging.getLogger(__name__)

def recommend_exercises(user_id, matiere_id=None, level_id=None, limit=DEFAULT_TOP_N):
    """
    Recommande des exercices vidéos pour un utilisateur.
    
    Args:
        user_id (int): ID de l'utilisateur
        matiere_id (int, optional): ID de la matière pour filtrer les recommandations
        level_id (int, optional): ID du niveau pour filtrer les recommandations
        limit (int, optional): Nombre de recommandations à retourner
        
    Returns:
        tuple: (liste d'objets Video recommandés, liste des scores correspondants)
    """
    logger.info(f"Recommending exercises for user {user_id}, matiere_id={matiere_id}, level_id={level_id}")
    
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
                return handle_exercise_cold_start(session, matiere_id=matiere_id, limit=limit)
        
        # Étape 2: Filtrer les vidéos par matière et niveau
        videos = filter_videos_by_subject_and_level(session, matiere_id=matiere_id, level_id=level_id)
        
        if not videos:
            logger.warning(f"No videos found for matiere_id={matiere_id} and level_id={level_id}")
            # Utiliser le cold start si aucune vidéo n'est trouvée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 3: Filtrer les vidéos déjà vues par l'utilisateur
        unseen_videos = filter_unseen_videos(session, videos, user_id)
        
        if not unseen_videos:
            logger.warning(f"No unseen videos found for user {user_id}")
            # Utiliser le cold start si aucune vidéo non vue n'est trouvée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 4: Récupérer la dernière vidéo vue par l'utilisateur (pour la proximité pédagogique)
        last_viewed = session.query(UserView).join(Video).filter(
            UserView.user_id == user_id
        ).order_by(UserView.updated_at.desc()).first()
        
        last_viewed_video = None
        if last_viewed:
            last_viewed_video = session.query(Video).filter_by(id=last_viewed.video_id).first()
            if last_viewed_video:
                logger.info(f"Last viewed video: id={last_viewed_video.id}, page={last_viewed_video.page}, manuel_id={last_viewed_video.manuel_id}")
        
        # Étape 5: Calculer les scores pour chaque vidéo
        scored_videos = []
        
        for video in unseen_videos:
            # Calculer le score de la vidéo
            score = calculate_video_score(session, video, user_id, last_viewed_video)
            scored_videos.append((video, score))
        
        # Étape 6: Trier par score décroissant
        scored_videos.sort(key=lambda x: x[1], reverse=True)
        
        # Étape 7: Retourner les top N recommandations
        top_videos = scored_videos[:limit]
        
        if not top_videos:
            logger.warning("No videos to recommend")
            # Utiliser le cold start si aucune vidéo n'est recommandée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        recommended_videos, scores = zip(*top_videos)
        logger.info(f"Returning {len(recommended_videos)} recommended videos")
        
        return recommended_videos, scores
    
    finally:
        # Fermer la session de base de données
        close_db_session(session)

def recommend_exercises_advanced(user_id, matiere_name=None, level_id=None, limit=DEFAULT_TOP_N):
    """
    Version avancée de la recommandation d'exercices utilisant le filtrage collaboratif
    et la proximité pédagogique.
    
    Args:
        user_id (int): ID de l'utilisateur
        matiere_name (str, optional): Nom de la matière pour filtrer les recommandations
        level_id (int, optional): ID du niveau pour filtrer les recommandations
        limit (int, optional): Nombre de recommandations à retourner
        
    Returns:
        tuple: (liste d'objets Video recommandés, liste des scores correspondants)
    """
    logger.info(f"Advanced exercise recommendation for user {user_id}, matiere={matiere_name}, level_id={level_id}")
    
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
                return handle_exercise_cold_start(session, matiere_name=matiere_name, limit=limit)
        
        # Étape 2: Récupérer l'ID de la matière si le nom est fourni
        matiere_id = None
        if matiere_name:
            # Normaliser le nom de la matière (pour gérer les cas comme 'الفرنسية' vs 'فرنسية')
            normalized_name = matiere_name.replace('ال', '')
            
            matiere = session.query(Material).filter(
                or_(
                    Material.name == matiere_name,
                    Material.name.like(f"%{normalized_name}%"),
                    Material.name.like(f"%{matiere_name}%")
                )
            ).first()
            
            if matiere:
                matiere_id = matiere.id
                logger.info(f"Found matiere ID: {matiere_id} for name: {matiere_name}")
            else:
                logger.warning(f"No matiere found with name: {matiere_name}")
                # Utiliser le cold start si aucune matière n'est trouvée
                return handle_exercise_cold_start(session, matiere_name=matiere_name, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 3: Filtrer les vidéos par matière et niveau
        videos = filter_videos_by_subject_and_level(session, matiere_id=matiere_id, level_id=level_id)
        
        if not videos:
            logger.warning(f"No videos found for matiere_id={matiere_id} and level_id={level_id}")
            # Utiliser le cold start si aucune vidéo n'est trouvée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 4: Filtrer les vidéos déjà vues par l'utilisateur
        unseen_videos = filter_unseen_videos(session, videos, user_id)
        
        if not unseen_videos:
            logger.warning(f"No unseen videos found for user {user_id}")
            # Utiliser le cold start si aucune vidéo non vue n'est trouvée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        # Étape 5: Trouver des utilisateurs similaires
        similar_users = find_similar_users(session, user_id)
        logger.info(f"Found {len(similar_users)} similar users")
        
        # Étape 6: Récupérer la dernière vidéo vue par l'utilisateur (pour la proximité pédagogique)
        last_viewed = session.query(UserView).join(Video).filter(
            UserView.user_id == user_id
        ).order_by(UserView.updated_at.desc()).first()
        
        last_viewed_video = None
        if last_viewed:
            last_viewed_video = session.query(Video).filter_by(id=last_viewed.video_id).first()
            if last_viewed_video:
                logger.info(f"Last viewed video: id={last_viewed_video.id}, page={last_viewed_video.page}, manuel_id={last_viewed_video.manuel_id}")
        
        # Étape 7: Calculer les scores pour chaque vidéo
        scored_videos = []
        
        for video in unseen_videos:
            # Calculer le score de base
            base_score = calculate_video_score(session, video, user_id, last_viewed_video)
            
            # Calculer le score de similarité
            similarity_score = calculate_similarity_score(session, video, user_id, similar_users)
            
            # Score total
            total_score = base_score + similarity_score
            
            scored_videos.append((video, total_score))
        
        # Étape 8: Trier par score décroissant
        scored_videos.sort(key=lambda x: x[1], reverse=True)
        
        # Étape 9: Retourner les top N recommandations
        top_videos = scored_videos[:limit]
        
        if not top_videos:
            logger.warning("No videos to recommend")
            # Utiliser le cold start si aucune vidéo n'est recommandée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
        
        recommended_videos, scores = zip(*top_videos)
        logger.info(f"Returning {len(recommended_videos)} recommended videos")
        
        return recommended_videos, scores
    
    finally:
        # Fermer la session de base de données
        close_db_session(session)
