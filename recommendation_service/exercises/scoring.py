"""
Fonctions de scoring pour les recommandations d'exercices.
"""

import logging
import numpy as np
from sqlalchemy import func

from recommendation_service.models import UserView, Like, Follow, User

logger = logging.getLogger(__name__)

def calculate_video_score(session, video, user_id, last_viewed_video=None):
    """
    Calcule le score d'une vidéo pour un utilisateur.
    
    Args:
        session: Session SQLAlchemy
        video: Objet Video
        user_id (int): ID de l'utilisateur
        last_viewed_video (Video, optional): Dernière vidéo vue par l'utilisateur
        
    Returns:
        float: Score de la vidéo
    """
    # Paramètres de pondération
    alpha = 1.0  # Poids pour les likes
    beta = 0.5   # Poids pour les vues
    gamma = 2.0  # Poids pour le bonus d'enfants similaires
    delta = 3.0  # Poids pour le bonus de proximité pédagogique
    epsilon = 1.5  # Poids pour le bonus d'enseignant suivi
    
    # Score de base: popularité
    popularity_score = (video.vues * beta) + (video.likes * alpha)
    
    # Bonus de proximité pédagogique
    proximity_score = 0.0
    if last_viewed_video:
        # Même manuel, même page
        if video.manuel_id == last_viewed_video.manuel_id and video.page == last_viewed_video.page:
            proximity_score = 10.0
        # Même manuel, page suivante
        elif video.manuel_id == last_viewed_video.manuel_id and video.page == last_viewed_video.page + 1:
            proximity_score = 8.0
        # Même manuel, page proche
        elif video.manuel_id == last_viewed_video.manuel_id and abs(video.page - last_viewed_video.page) <= 2:
            proximity_score = 5.0
    
    # Bonus pour enseignant suivi
    teacher_follow_bonus = 0.0
    is_following = session.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == video.user_id
    ).first()
    
    if is_following:
        teacher_follow_bonus = epsilon
    
    # Score total
    total_score = popularity_score + (proximity_score * delta) + teacher_follow_bonus
    
    return total_score

def calculate_similarity_score(session, video, user_id, similar_users):
    """
    Calcule le score de similarité pour une vidéo basé sur les utilisateurs similaires.
    
    Args:
        session: Session SQLAlchemy
        video: Objet Video
        user_id (int): ID de l'utilisateur
        similar_users (list): Liste de tuples (user_id, similarity_score)
        
    Returns:
        float: Score de similarité
    """
    if not similar_users:
        return 0.0
    
    similar_user_ids = [u[0] for u in similar_users]
    similarity_weights = {u[0]: u[1] for u in similar_users}
    
    # Compter les vues par des enfants similaires
    similar_views = session.query(UserView).filter(
        UserView.video_id == video.id,
        UserView.user_id.in_(similar_user_ids)
    ).all()
    
    # Compter les likes par des enfants similaires
    similar_likes = session.query(Like).filter(
        Like.video_id == video.id,
        Like.user_id.in_(similar_user_ids)
    ).all()
    
    # Calculer le score pondéré par la similarité
    view_score = sum(similarity_weights.get(view.user_id, 0) for view in similar_views)
    like_score = sum(similarity_weights.get(like.user_id, 0) * 2.0 for like in similar_likes)
    
    return view_score + like_score

def find_similar_users(session, user_id, min_similarity=0.1):
    """
    Trouve des utilisateurs similaires à l'utilisateur donné.
    
    Args:
        session: Session SQLAlchemy
        user_id (int): ID de l'utilisateur
        min_similarity (float): Similarité minimale requise
        
    Returns:
        list: Liste de tuples (user_id, similarity_score)
    """
    # Récupérer les vidéos vues par l'utilisateur
    user_views = session.query(UserView.video_id).filter_by(user_id=user_id).all()
    user_view_ids = [v[0] for v in user_views]
    
    if not user_view_ids:
        logger.warning(f"User {user_id} has no video views")
        return []
    
    # Récupérer les vidéos likées par l'utilisateur
    user_likes = session.query(Like.video_id).filter_by(user_id=user_id).all()
    user_like_ids = [l[0] for l in user_likes]
    
    # Trouver d'autres utilisateurs qui ont vu ou aimé les mêmes vidéos
    similar_user_ids = session.query(UserView.user_id).filter(
        UserView.video_id.in_(user_view_ids),
        UserView.user_id != user_id
    ).union(
        session.query(Like.user_id).filter(
            Like.video_id.in_(user_like_ids),
            Like.user_id != user_id
        )
    ).distinct().all()
    
    similar_user_ids = [u[0] for u in similar_user_ids]
    
    if not similar_user_ids:
        logger.warning(f"No similar users found for user {user_id}")
        return []
    
    # Calculer la similarité pour chaque utilisateur
    similar_users = []
    
    for similar_id in similar_user_ids:
        # Récupérer les vidéos vues par l'utilisateur similaire
        similar_views = session.query(UserView.video_id).filter_by(user_id=similar_id).all()
        similar_view_ids = [v[0] for v in similar_views]
        
        # Récupérer les vidéos likées par l'utilisateur similaire
        similar_likes = session.query(Like.video_id).filter_by(user_id=similar_id).all()
        similar_like_ids = [l[0] for l in similar_likes]
        
        # Calculer la similarité cosinus
        # Pour simplifier, nous utilisons une approche basée sur l'intersection
        view_intersection = len(set(user_view_ids).intersection(similar_view_ids))
        like_intersection = len(set(user_like_ids).intersection(similar_like_ids))
        
        # Pondérer les likes plus fortement que les vues
        similarity = (view_intersection + like_intersection * 2.0) / (len(user_view_ids) + len(user_like_ids) + 1)
        
        if similarity >= min_similarity:
            similar_users.append((similar_id, similarity))
    
    # Trier par similarité décroissante
    similar_users.sort(key=lambda x: x[1], reverse=True)
    
    return similar_users
