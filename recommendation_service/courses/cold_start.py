"""
Fonctions de gestion du cold start pour la recommandation de cours (webinaires).
"""

import logging
from sqlalchemy import func, desc, and_, or_

from recommendation_service.common.config import ACTIVE_STATUS
from recommendation_service.models import (
    Webinar, WebinarTranslation, User, Follow, ChildActivity, OrderItem
)
from recommendation_service.utils.manual_finder import get_matiere_id_from_name

logger = logging.getLogger(__name__)

def handle_course_cold_start(session, matiere_id=None, matiere_name=None, level_id=None, user_id=None, limit=5):
    """
    Gère le cas du cold start pour les recommandations de cours.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        matiere_name (str, optional): Nom de la matière
        level_id (int, optional): ID du niveau
        user_id (int, optional): ID de l'utilisateur (pour les enseignants suivis)
        limit (int, optional): Nombre de recommandations à retourner
        
    Returns:
        tuple: (liste d'objets Webinar, liste des scores)
    """
    logger.info(f"Handling cold start for courses: matiere_id={matiere_id}, matiere_name={matiere_name}, level_id={level_id}")
    
    # Si matiere_id n'est pas fourni mais matiere_name l'est, essayer de trouver matiere_id
    if not matiere_id and matiere_name:
        matiere_id = get_matiere_id_from_name(matiere_name, level_id, session)
        logger.info(f"Found matiere_id: {matiere_id} for matiere_name: {matiere_name}")
    
    # Requête de base pour les webinaires actifs et non supprimés
    query = session.query(Webinar).filter(
        Webinar.status == ACTIVE_STATUS,
        Webinar.deleted_at.is_(None)
    )
    
    # Filtrer par matière si spécifiée
    if matiere_id:
        query = query.filter(Webinar.matiere_id == matiere_id)
    
    # Filtrer par niveau si spécifié
    if level_id:
        query = query.filter(Webinar.level_id == level_id)
    
    # Récupérer les IDs des enseignants suivis par l'utilisateur
    followed_teachers = []
    if user_id:
        followed_teachers = session.query(Follow.user_id).filter(
            Follow.follower == user_id
        ).all()
        followed_teachers = [t[0] for t in followed_teachers]
        logger.info(f"User {user_id} follows {len(followed_teachers)} teachers")
    
    # Bonus pour les enseignants suivis
    if followed_teachers:
        # Utiliser une expression de cas pour donner un bonus aux enseignants suivis
        bonus_expr = func.case(
            [(Webinar.teacher_id.in_(followed_teachers), 50.0)],
            else_=0.0
        )
        
        # Sous-requête pour compter les achats
        purchases_subq = session.query(
            OrderItem.model_id.label('webinar_id'),
            func.count(OrderItem.id).label('purchase_count')
        ).filter(
            OrderItem.model_type == 'Webinar'
        ).group_by(OrderItem.model_id).subquery()
        
        # Sous-requête pour compter les vues
        views_subq = session.query(
            ChildActivity.reference_id.label('webinar_id'),
            func.count(ChildActivity.id).label('view_count')
        ).filter(
            ChildActivity.action_type == 'webinar'
        ).group_by(ChildActivity.reference_id).subquery()
        
        # Joindre les sous-requêtes
        query = query.outerjoin(
            purchases_subq,
            Webinar.id == purchases_subq.c.webinar_id
        ).outerjoin(
            views_subq,
            Webinar.id == views_subq.c.webinar_id
        )
        
        # Trier par popularité avec bonus pour les enseignants suivis
        query = query.order_by(desc(
            bonus_expr + 
            func.coalesce(purchases_subq.c.purchase_count, 0) * 2.0 + 
            func.coalesce(views_subq.c.view_count, 0) * 0.5
        ))
    else:
        # Sous-requête pour compter les achats
        purchases_subq = session.query(
            OrderItem.model_id.label('webinar_id'),
            func.count(OrderItem.id).label('purchase_count')
        ).filter(
            OrderItem.model_type == 'Webinar'
        ).group_by(OrderItem.model_id).subquery()
        
        # Sous-requête pour compter les vues
        views_subq = session.query(
            ChildActivity.reference_id.label('webinar_id'),
            func.count(ChildActivity.id).label('view_count')
        ).filter(
            ChildActivity.action_type == 'webinar'
        ).group_by(ChildActivity.reference_id).subquery()
        
        # Joindre les sous-requêtes
        query = query.outerjoin(
            purchases_subq,
            Webinar.id == purchases_subq.c.webinar_id
        ).outerjoin(
            views_subq,
            Webinar.id == views_subq.c.webinar_id
        )
        
        # Trier par popularité uniquement
        query = query.order_by(desc(
            func.coalesce(purchases_subq.c.purchase_count, 0) * 2.0 + 
            func.coalesce(views_subq.c.view_count, 0) * 0.5
        ))
    
    # Limiter le nombre de résultats
    webinars = query.limit(limit).all()
    
    # Calculer les scores
    scores = []
    for webinar in webinars:
        base_score = 0.0
        
        # Compter les achats
        purchase_count = session.query(func.count(OrderItem.id)).filter(
            OrderItem.model_type == 'Webinar',
            OrderItem.model_id == webinar.id
        ).scalar() or 0
        
        # Compter les vues
        view_count = session.query(func.count(ChildActivity.id)).filter(
            ChildActivity.action_type == 'webinar',
            ChildActivity.reference_id == webinar.id
        ).scalar() or 0
        
        base_score = purchase_count * 2.0 + view_count * 0.5
        teacher_bonus = 50.0 if webinar.teacher_id in followed_teachers else 0.0
        scores.append(base_score + teacher_bonus)
    
    logger.info(f"Cold start returned {len(webinars)} webinars")
    
    return webinars, scores

def get_popular_courses(session, matiere_id=None, level_id=None, limit=5):
    """
    Récupère les cours les plus populaires pour une matière et un niveau donnés.
    
    Args:
        session: Session SQLAlchemy
        matiere_id (int, optional): ID de la matière
        level_id (int, optional): ID du niveau
        limit (int, optional): Nombre de cours à retourner
        
    Returns:
        tuple: (liste d'objets Webinar, liste de scores)
    """
    return handle_course_cold_start(session, matiere_id=matiere_id, level_id=level_id, limit=limit)
