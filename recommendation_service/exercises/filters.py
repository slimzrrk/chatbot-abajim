"""
Fonctions de filtrage pour les recommandations d'exercices.
"""

import logging
from sqlalchemy import and_, or_

from recommendation_service.common.config import APPROVED_STATUS, MANUAL_LEVEL_MAPPING
from recommendation_service.models import Video, Manuel, Material, UserView

logger = logging.getLogger(__name__)

def filter_videos_by_subject_and_level(session, matiere_id=None, matiere_name=None, level_id=None):
    """
    Filtre les vidéos par matière et niveau.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        matiere_name (str, optional): Nom de la matière
        level_id (int, optional): ID du niveau
        
    Returns:
        list: Liste des vidéos filtrées
    """
    logger.info(f"Filtering videos by subject (matiere_id={matiere_id}, matiere_name={matiere_name}) and level (level_id={level_id})")
    
    # Construire la requête de base
    query = session.query(Video).filter(Video.status == APPROVED_STATUS)
    
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
            material = session.query(Material).filter(
                or_(
                    Material.name == matiere_name,
                    Material.name.like(f"%{matiere_name}%")
                )
            ).first()
            
            if material:
                manuel_query = manuel_query.filter(Manuel.material_id == material.id)
            else:
                logger.warning(f"No material found with name: {matiere_name}")
                return []
        
        # Filtrer par material_ids du niveau
        if material_ids:
            manuel_query = manuel_query.filter(Manuel.material_id.in_(material_ids))
        
        # Exécuter la requête
        manuel_ids = [m[0] for m in manuel_query.all()]
        
        if not manuel_ids:
            logger.warning(f"No manuals found for the specified criteria")
            return []
        
        # Filtrer les vidéos par manuel_id
        query = query.filter(Video.manuel_id.in_(manuel_ids))
    
    # Exécuter la requête finale
    videos = query.all()
    
    logger.info(f"Found {len(videos)} videos matching the criteria")
    
    return videos

def filter_unseen_videos(session, videos, user_id):
    """
    Filtre les vidéos non vues par l'utilisateur.
    
    Args:
        session: Session SQLAlchemy
        videos (list): Liste des vidéos à filtrer
        user_id (int): ID de l'utilisateur
        
    Returns:
        list: Liste des vidéos non vues
    """
    if not videos:
        return []
    
    # Récupérer les IDs des vidéos
    video_ids = [v.id for v in videos]
    
    # Récupérer les IDs des vidéos déjà vues par l'utilisateur
    viewed_video_ids = session.query(UserView.video_id).filter(
        UserView.user_id == user_id,
        UserView.video_id.in_(video_ids)
    ).all()
    
    viewed_video_ids = [v[0] for v in viewed_video_ids]
    
    # Filtrer les vidéos non vues
    unseen_videos = [v for v in videos if v.id not in viewed_video_ids]
    
    logger.info(f"Filtered out {len(videos) - len(unseen_videos)} already seen videos")
    
    return unseen_videos
