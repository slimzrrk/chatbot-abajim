"""
Fonctions de calcul de score pour la recommandation de cours (webinaires).
"""

import logging
from sqlalchemy import func, and_, or_
from collections import defaultdict

from recommendation_service.common.config import WEIGHTS, MIN_SIMILARITY_SCORE
from recommendation_service.models import (
    Webinar, User, Follow, UserView, UserMinWatched, Like, Video,
    ChildActivity, OrderItem
)

logger = logging.getLogger(__name__)

def calculate_webinar_score(session, webinar, user_id):
    """
    Calcule le score d'un webinaire pour un utilisateur.

    Args:
        session: Session SQLAlchemy
        webinar (Webinar): Objet Webinar
        user_id (int): ID de l'utilisateur

    Returns:
        float: Score du webinaire
    """
    # Initialiser les composantes du score
    teacher_relation_score = 0.0
    popularity_score = 0.0
    content_relevance_score = 0.0

    # 1. Score de relation avec l'enseignant
    # Vérifier si l'utilisateur suit l'enseignant
    follows_teacher = session.query(Follow).filter(
        Follow.follower == user_id,
        Follow.user_id == webinar.teacher_id
    ).first() is not None

    if follows_teacher:
        teacher_relation_score += 5.0
        logger.debug(f"User {user_id} follows teacher {webinar.teacher_id}: +5.0")

    # Vérifier si l'utilisateur a regardé des vidéos de cet enseignant
    teacher_views = session.query(func.count(UserView.id)).join(
        Video, UserView.video_id == Video.id
    ).filter(
        UserView.user_id == user_id,
        Video.user_id == webinar.teacher_id
    ).scalar() or 0

    if teacher_views > 0:
        view_bonus = min(teacher_views * 0.5, 5.0)  # Plafonner à 5.0
        teacher_relation_score += view_bonus
        logger.debug(f"User {user_id} has watched {teacher_views} videos from teacher {webinar.teacher_id}: +{view_bonus}")

    # 2. Score de popularité du webinaire
    # Nombre d'achats du webinaire
    purchase_count = session.query(func.count(OrderItem.id)).filter(
        OrderItem.model_type == 'Webinar',
        OrderItem.model_id == webinar.id
    ).scalar() or 0

    # Nombre de vues du webinaire
    view_count = session.query(func.count(ChildActivity.id)).filter(
        ChildActivity.action_type == 'webinar',
        ChildActivity.reference_id == webinar.id
    ).scalar() or 0

    # Calculer le score de popularité (sans utiliser la quantité)
    popularity_score = (purchase_count * 2.0) + (view_count * 0.5)
    logger.debug(f"Webinar {webinar.id} has {purchase_count} purchases and {view_count} views: popularity_score={popularity_score}")

    # 3. Score de pertinence par contenu
    # Récupérer le dernier exercice vu par l'utilisateur
    last_viewed = session.query(UserView).filter(
        UserView.user_id == user_id
    ).order_by(UserView.created_at.desc()).first()

    if last_viewed:
        # Récupérer la vidéo
        last_video = session.query(Video).filter(Video.id == last_viewed.video_id).first()

        if last_video and last_video.titre:
            # Récupérer le titre du webinaire
            webinar_title = None
            webinar_translation = session.query(Webinar.translations).filter(
                Webinar.id == webinar.id
            ).first()

            if webinar_translation and webinar_translation.title:
                webinar_title = webinar_translation.title

            # Si les titres contiennent des mots communs, augmenter le score
            if webinar_title and last_video.titre:
                # Simplifier en vérifiant si des mots du titre de la vidéo sont dans le titre du webinaire
                video_words = set(last_video.titre.lower().split())
                if webinar_title:
                    webinar_words = set(webinar_title.lower().split())
                    common_words = video_words.intersection(webinar_words)

                    if common_words:
                        content_relevance_score = len(common_words) * 2.0
                        logger.debug(f"Webinar {webinar.id} has {len(common_words)} common words with last viewed video: +{content_relevance_score}")

    # Calculer le score total pondéré
    total_score = (
        teacher_relation_score * WEIGHTS['interaction'] +
        popularity_score * WEIGHTS['popularity'] +
        content_relevance_score * WEIGHTS['content']
    )

    logger.debug(f"Webinar {webinar.id} total score: {total_score}")
    return total_score

def find_similar_users(session, user_id):
    """
    Trouve des utilisateurs similaires à l'utilisateur donné.

    Args:
        session: Session SQLAlchemy
        user_id (int): ID de l'utilisateur

    Returns:
        dict: Dictionnaire des utilisateurs similaires avec leur score de similarité
    """
    logger.info(f"Finding similar users for user {user_id}")

    # Récupérer les enseignants suivis par l'utilisateur
    user_follows = session.query(Follow.user_id).filter(
        Follow.follower == user_id
    ).all()
    user_follows = {f[0] for f in user_follows}

    # Récupérer les vidéos vues par l'utilisateur
    user_views = session.query(UserView.video_id).filter(
        UserView.user_id == user_id
    ).all()
    user_views = {v[0] for v in user_views}

    # Récupérer les vidéos aimées par l'utilisateur
    user_likes = session.query(Like.video_id).filter(
        Like.user_id == user_id
    ).all()
    user_likes = {l[0] for l in user_likes}

    # Trouver des utilisateurs qui suivent les mêmes enseignants ou regardent les mêmes vidéos
    similar_users = {}

    # Utilisateurs qui suivent les mêmes enseignants
    if user_follows:
        follow_query = session.query(
            Follow.follower,
            func.count(Follow.user_id).label('common_follows')
        ).filter(
            Follow.user_id.in_(user_follows),
            Follow.follower != user_id
        ).group_by(Follow.follower)

        for follower, common_count in follow_query:
            similarity = common_count / len(user_follows)
            if similarity >= MIN_SIMILARITY_SCORE:
                similar_users[follower] = similar_users.get(follower, 0) + similarity * 0.4

    # Utilisateurs qui regardent les mêmes vidéos
    if user_views:
        view_query = session.query(
            UserView.user_id,
            func.count(UserView.video_id).label('common_views')
        ).filter(
            UserView.video_id.in_(user_views),
            UserView.user_id != user_id
        ).group_by(UserView.user_id)

        for viewer, common_count in view_query:
            similarity = common_count / len(user_views)
            if similarity >= MIN_SIMILARITY_SCORE:
                similar_users[viewer] = similar_users.get(viewer, 0) + similarity * 0.3

    # Utilisateurs qui aiment les mêmes vidéos
    if user_likes:
        like_query = session.query(
            Like.user_id,
            func.count(Like.video_id).label('common_likes')
        ).filter(
            Like.video_id.in_(user_likes),
            Like.user_id != user_id
        ).group_by(Like.user_id)

        for liker, common_count in like_query:
            similarity = common_count / len(user_likes)
            if similarity >= MIN_SIMILARITY_SCORE:
                similar_users[liker] = similar_users.get(liker, 0) + similarity * 0.3

    logger.info(f"Found {len(similar_users)} similar users")
    return similar_users

def calculate_similarity_score(session, webinar, similar_users):
    """
    Calcule le score de similarité pour un webinaire basé sur les utilisateurs similaires.

    Args:
        session: Session SQLAlchemy
        webinar (Webinar): Objet Webinar
        similar_users (dict): Dictionnaire des utilisateurs similaires avec leur score de similarité

    Returns:
        float: Score de similarité
    """
    if not similar_users:
        return 0.0

    similarity_score = 0.0

    # Vérifier si des utilisateurs similaires ont acheté ou vu ce webinaire
    for user_id, similarity in similar_users.items():
        try:
            # Vérifier les achats (utiliser une requête SQL brute pour éviter les problèmes de colonnes)
            purchase_count = session.execute(
                "SELECT COUNT(*) FROM order_items WHERE user_id = :user_id AND model_type = :model_type AND model_id = :model_id",
                {"user_id": user_id, "model_type": "Webinar", "model_id": webinar.id}
            ).scalar() or 0

            if purchase_count > 0:
                similarity_score += similarity * 2.0
                continue

            # Vérifier les vues
            view_count = session.query(ChildActivity).filter(
                ChildActivity.child_id == user_id,
                ChildActivity.action_type == 'webinar',
                ChildActivity.reference_id == webinar.id
            ).count()

            if view_count > 0:
                similarity_score += similarity * 1.0
        except Exception as e:
            logger.error(f"Error calculating similarity for user {user_id} and webinar {webinar.id}: {str(e)}")
            # Continuer avec le prochain utilisateur
            continue

    # Pondérer le score de similarité
    weighted_score = similarity_score * WEIGHTS['similarity']

    logger.debug(f"Webinar {webinar.id} similarity score: {weighted_score}")
    return weighted_score
