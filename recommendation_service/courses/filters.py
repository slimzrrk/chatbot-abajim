"""
Fonctions de filtrage pour la recommandation de cours (webinaires).
"""

import logging
from sqlalchemy import and_, or_, func
from sqlalchemy.orm import joinedload

from recommendation_service.common.config import ACTIVE_STATUS
from recommendation_service.models import (
    Webinar, WebinarTranslation, WebinarChapter, File, User, Material,
    ChildActivity
)

logger = logging.getLogger(__name__)

def filter_webinars_by_subject_and_level(session, matiere_id=None, level_id=None):
    """
    Filtre les webinaires par matière et niveau.

    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        level_id (int, optional): ID du niveau

    Returns:
        list: Liste des webinaires filtrés
    """
    logger.info(f"Filtering webinars by matiere_id={matiere_id}, level_id={level_id}")

    # Requête de base pour les webinaires non supprimés
    # Inclure tous les webinaires, quel que soit leur statut
    query = session.query(Webinar).filter(
        Webinar.deleted_at.is_(None)
    )

    # Filtrer par matière si spécifiée
    if matiere_id:
        query = query.filter(Webinar.matiere_id == matiere_id)

    # Filtrer par niveau si spécifié
    if level_id:
        query = query.filter(Webinar.level_id == level_id)

    # Exécuter la requête
    webinars = query.all()
    logger.info(f"Found {len(webinars)} webinars matching criteria")

    return webinars

def filter_unseen_webinars(session, webinars, user_id):
    """
    Filtre les webinaires déjà vus par l'utilisateur.
    Si tous les webinaires ont déjà été vus, retourne les webinaires originaux.

    Args:
        session: Session SQLAlchemy
        webinars (list): Liste des webinaires à filtrer
        user_id (int): ID de l'utilisateur

    Returns:
        list: Liste des webinaires non vus par l'utilisateur, ou tous les webinaires si tous ont été vus
    """
    logger.info(f"Filtering unseen webinars for user {user_id}")

    if not webinars:
        return []

    # Récupérer les IDs des webinaires déjà vus par l'utilisateur
    seen_webinar_ids = session.query(ChildActivity.reference_id).filter(
        ChildActivity.child_id == user_id,
        ChildActivity.action_type == 'webinar'
    ).all()

    # Convertir en ensemble pour une recherche plus rapide
    seen_webinar_ids = {id[0] for id in seen_webinar_ids}
    logger.info(f"User {user_id} has seen {len(seen_webinar_ids)} webinars")

    # Filtrer les webinaires non vus
    unseen_webinars = [w for w in webinars if w.id not in seen_webinar_ids]
    logger.info(f"Found {len(unseen_webinars)} unseen webinars")

    # Si aucun webinaire non vu n'est disponible, retourner tous les webinaires
    if not unseen_webinars:
        logger.info(f"No unseen webinars found, returning all {len(webinars)} webinars")
        return webinars

    return unseen_webinars
