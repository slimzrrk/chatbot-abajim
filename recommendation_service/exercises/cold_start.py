"""
Module pour la gestion du cold start dans les recommandations d'exercices.
"""

import logging
from sqlalchemy import desc, func

from recommendation_service.common.config import APPROVED_STATUS, MANUAL_LEVEL_MAPPING
from recommendation_service.models import Video, Manuel, Material, Follow

logger = logging.getLogger(__name__)

def handle_exercise_cold_start(session, matiere_id=None, matiere_name=None, level_id=None, user_id=None, limit=5):
    """
    Gère le cas du cold start pour les recommandations d'exercices.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        matiere_name (str, optional): Nom de la matière
        level_id (int, optional): ID du niveau
        user_id (int, optional): ID de l'utilisateur (pour les enseignants suivis)
        limit (int, optional): Nombre de recommandations à retourner
        
    Returns:
        tuple: (liste d'objets Video, liste des scores)
    """
    logger.info(f"Handling cold start for exercises: matiere_id={matiere_id}, matiere_name={matiere_name}, level_id={level_id}")
    
    # Récupérer les IDs des manuels correspondant au niveau et à la matière
    manuel_ids = []
    
    if level_id and level_id in MANUAL_LEVEL_MAPPING:
        # Récupérer les material_ids pour ce niveau
        material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])
        
        # Construire la requête pour les manuels
        manuel_query = session.query(Manuel.id)
        
        if matiere_id:
            # Filtrer par matière si l'ID est fourni
            manuel_query = manuel_query.filter(Manuel.material_id == matiere_id)
        elif matiere_name:
            # Filtrer par nom de matière si fourni
            material = session.query(Material).filter(Material.name == matiere_name).first()
            
            if material:
                manuel_query = manuel_query.filter(Manuel.material_id == material.id)
            else:
                logger.warning(f"No material found with name: {matiere_name}")
                return [], []
        
        # Filtrer par material_ids du niveau
        if material_ids:
            manuel_query = manuel_query.filter(Manuel.material_id.in_(material_ids))
        
        # Exécuter la requête
        manuel_ids = [m[0] for m in manuel_query.all()]
    
    if not manuel_ids:
        logger.warning(f"No manuals found for the specified criteria")
        return [], []
    
    # Récupérer les enseignants suivis par l'utilisateur
    followed_teachers = []
    if user_id:
        followed_teachers = session.query(Follow.following_id).filter(
            Follow.follower_id == user_id
        ).all()
        followed_teachers = [t[0] for t in followed_teachers]
    
    # Construire la requête pour les vidéos populaires
    query = session.query(Video).filter(
        Video.status == APPROVED_STATUS,
        Video.manuel_id.in_(manuel_ids)
    )
    
    # Bonus pour les enseignants suivis
    if followed_teachers:
        # Utiliser une expression de cas pour donner un bonus aux enseignants suivis
        bonus_expr = func.case(
            [(Video.user_id.in_(followed_teachers), 50.0)],
            else_=0.0
        )
        
        # Trier par popularité avec bonus pour les enseignants suivis
        query = query.order_by(desc(bonus_expr + Video.vues * 0.5 + Video.likes * 2.0))
    else:
        # Trier par popularité uniquement
        query = query.order_by(desc(Video.vues * 0.5 + Video.likes * 2.0))
    
    # Limiter le nombre de résultats
    videos = query.limit(limit).all()
    
    # Calculer les scores
    scores = []
    for video in videos:
        base_score = video.vues * 0.5 + video.likes * 2.0
        teacher_bonus = 50.0 if video.user_id in followed_teachers else 0.0
        scores.append(base_score + teacher_bonus)
    
    logger.info(f"Cold start returned {len(videos)} videos")
    
    return videos, scores

def get_popular_exercises(session, matiere_id=None, level_id=None, limit=5):
    """
    Récupère les exercices les plus populaires pour une matière et un niveau donnés.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        level_id (int, optional): ID du niveau
        limit (int, optional): Nombre d'exercices à retourner
        
    Returns:
        tuple: (liste d'objets Video, liste de scores)
    """
    return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, limit=limit)

def get_exercises_by_page_progression(session, matiere_id=None, level_id=None, limit=5):
    """
    Récupère les exercices en suivant une progression pédagogique par page.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        level_id (int, optional): ID du niveau
        limit (int, optional): Nombre d'exercices à retourner
        
    Returns:
        tuple: (liste d'objets Video, liste de scores)
    """
    logger.info(f"Getting exercises by page progression: matiere_id={matiere_id}, level_id={level_id}")
    
    # Récupérer les IDs des manuels correspondant au niveau et à la matière
    manuel_ids = []
    
    if level_id and level_id in MANUAL_LEVEL_MAPPING:
        # Récupérer les material_ids pour ce niveau
        material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])
        
        # Construire la requête pour les manuels
        manuel_query = session.query(Manuel.id)
        
        if matiere_id:
            # Filtrer par matière si l'ID est fourni
            manuel_query = manuel_query.filter(Manuel.material_id == matiere_id)
        
        # Filtrer par material_ids du niveau
        if material_ids:
            manuel_query = manuel_query.filter(Manuel.material_id.in_(material_ids))
        
        # Exécuter la requête
        manuel_ids = [m[0] for m in manuel_query.all()]
    
    if not manuel_ids:
        logger.warning(f"No manuals found for the specified criteria")
        return [], []
    
    # Récupérer les exercices vidéos disponibles
    query = session.query(Video).filter(
        Video.status == APPROVED_STATUS,
        Video.manuel_id.in_(manuel_ids)
    )
    
    # Trier par manuel, puis par page, puis par numéro
    query = query.order_by(Video.manuel_id, Video.page, Video.numero)
    
    # Limiter le nombre de résultats
    videos = query.limit(limit).all()
    
    # Scores arbitraires décroissants pour maintenir l'ordre
    scores = [100 - i for i in range(len(videos))]
    
    logger.info(f"Page progression returned {len(videos)} videos")
    
    return videos, scores
