"""
Teacher ranking functions for the recommendation system.
"""

import logging
import math
import numpy as np
import pandas as pd
from sqlalchemy import func, and_, or_

from recommendation_service.common.config import WEIGHTS, INTERACTION_SCORES, MANUAL_LEVEL_MAPPING
from recommendation_service.models import User, Video, Webinar, Follow, Like, UserView, UserMinWatched, Manuel, Material, WebinarChapter, File

logger = logging.getLogger(__name__)

def calculate_content_score(session, teacher_id, matiere_name, level_id):
    """
    Calculate content score for a teacher based on the number of videos and webinars.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teacher_id (int): Teacher ID
        matiere_name (str): Subject name
        level_id (int): Level ID

    Returns:
        float: Content score
    """
    logger.info(f"Calculating content score for teacher {teacher_id}")

    # Get the list of material IDs for this level
    level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])

    if not level_material_ids:
        logger.warning(f"No material IDs found for level {level_id}")
        return 0.0

    # Find material ID by name and level
    material = session.query(Material).filter(
        Material.name == matiere_name,
        Material.id.in_(level_material_ids)
    ).first()

    if not material:
        logger.warning(f"Material '{matiere_name}' not found for level {level_id}")
        return 0.0

    material_id = material.id

    # Find manuels for this material
    manuels = session.query(Manuel).filter(
        Manuel.material_id == material_id
    ).all()

    if not manuels:
        logger.warning(f"No manuels found for material ID {material_id}")
        return 0.0

    manuel_ids = [manuel.id for manuel in manuels]

    # Count videos for these manuels
    video_count = session.query(func.count(Video.id)).filter(
        Video.user_id == teacher_id,
        Video.manuel_id.in_(manuel_ids),
        Video.status == 'APPROVED'
    ).scalar() or 0

    # Count webinars for this material and level (any status)
    webinar_count = session.query(func.count(Webinar.id)).filter(
        Webinar.teacher_id == teacher_id,
        Webinar.matiere_id == material_id,
        Webinar.level_id == level_id
    ).scalar() or 0

    # Count files in webinar chapters for this material and level
    file_count = session.query(func.count(File.id)).join(
        WebinarChapter, File.chapter_id == WebinarChapter.id
    ).join(
        Webinar, WebinarChapter.webinar_id == Webinar.id
    ).filter(
        Webinar.teacher_id == teacher_id,
        Webinar.matiere_id == material_id,
        Webinar.level_id == level_id,
        File.status == 'active'
    ).scalar() or 0

    # Calculate score
    score = video_count * 1.0 + webinar_count * 2.0 + file_count * 1.5

    # Normalize score (log scale to prevent domination by prolific teachers)
    if score > 0:
        score = math.log(1 + score)

    logger.info(f"Content score for teacher {teacher_id}: {score} (videos: {video_count}, webinars: {webinar_count}, files: {file_count})")

    return score

def calculate_popularity_score(session, teacher_id):
    """
    Calculate popularity score for a teacher based on the number of followers.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teacher_id (int): Teacher ID

    Returns:
        float: Popularity score
    """
    logger.info(f"Calculating popularity score for teacher {teacher_id}")

    # Count followers
    follower_count = session.query(func.count(Follow.id)).filter(
        Follow.user_id == teacher_id,
        Follow.status == 'accepted'
    ).scalar() or 0

    # Calculate score (log scale to prevent domination by very popular teachers)
    score = math.log(1 + follower_count)

    logger.info(f"Popularity score for teacher {teacher_id}: {score} (followers: {follower_count})")

    return score

def calculate_interaction_score(session, teacher_id, matiere_name=None, level_id=None):
    """
    Calculate interaction score for a teacher based on likes, views, and watch time.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teacher_id (int): Teacher ID
        matiere_name (str, optional): Subject name
        level_id (int, optional): Level ID

    Returns:
        float: Interaction score
    """
    logger.info(f"Calculating interaction score for teacher {teacher_id}")

    # If matiere_name and level_id are provided, filter by subject and level
    if matiere_name and level_id:
        # Get the list of material IDs for this level
        level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])

        if not level_material_ids:
            logger.warning(f"No material IDs found for level {level_id}")
            return 0.0

        # Find material ID by name and level
        material = session.query(Material).filter(
            Material.name == matiere_name,
            Material.id.in_(level_material_ids)
        ).first()

        if not material:
            logger.warning(f"Material '{matiere_name}' not found for level {level_id}")
            return 0.0

        material_id = material.id

        # Find manuels for this material
        manuels = session.query(Manuel).filter(
            Manuel.material_id == material_id
        ).all()

        if not manuels:
            logger.warning(f"No manuels found for material ID {material_id}")
            return 0.0

        manuel_ids = [manuel.id for manuel in manuels]

        # Get teacher's videos for these manuels
        video_ids = [video.id for video in session.query(Video.id).filter(
            Video.user_id == teacher_id,
            Video.manuel_id.in_(manuel_ids),
            Video.status == 'APPROVED'
        ).all()]
    else:
        # Get all teacher's videos
        video_ids = [video.id for video in session.query(Video.id).filter(
            Video.user_id == teacher_id,
            Video.status == 'APPROVED'
        ).all()]

    if not video_ids:
        logger.info(f"No videos found for teacher {teacher_id}")
        return 0.0

    # Count likes
    like_count = session.query(func.count(Like.id)).filter(
        Like.video_id.in_(video_ids)
    ).scalar() or 0

    # Count views
    view_count = session.query(func.count(UserView.id)).filter(
        UserView.video_id.in_(video_ids)
    ).scalar() or 0

    # Calculate total watch time
    total_minutes_watched = session.query(func.sum(Video.total_minutes_watched)).filter(
        Video.id.in_(video_ids)
    ).scalar() or 0

    # Convert to float if it's a Decimal
    if hasattr(total_minutes_watched, 'to_integral_value'):
        total_minutes_watched = float(total_minutes_watched)

    # Calculate score
    score = like_count * 3.0 + view_count * 1.0 + total_minutes_watched * 0.1

    # Normalize score (log scale to prevent domination)
    if score > 0:
        score = math.log(1 + score)

    logger.info(f"Interaction score for teacher {teacher_id}: {score} (likes: {like_count}, views: {view_count}, minutes: {total_minutes_watched})")

    return score

def calculate_similarity_bonus(session, teacher_id, student_id):
    """
    Calculate similarity bonus for a teacher based on collaborative filtering.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teacher_id (int): Teacher ID
        student_id (int): Student ID

    Returns:
        float: Similarity bonus
    """
    logger.info(f"Calculating similarity bonus for teacher {teacher_id} and student {student_id}")

    # If no student ID provided, return 0
    if not student_id:
        return 0.0

    # Get student's follows
    student_follows = [follow.user_id for follow in session.query(Follow.user_id).filter(
        Follow.follower == student_id,
        Follow.status == 'accepted'
    ).all()]

    # Get student's likes
    student_video_likes = [like.video_id for like in session.query(Like.video_id).filter(
        Like.user_id == student_id
    ).all()]

    # Get student's views
    student_video_views = [view.video_id for view in session.query(UserView.video_id).filter(
        UserView.user_id == student_id
    ).all()]

    # If student has no interactions, return 0
    if not student_follows and not student_video_likes and not student_video_views:
        logger.info(f"No interactions found for student {student_id}")
        return 0.0

    # Find similar students
    similar_students = []

    # Find students who follow the same teachers
    if student_follows:
        similar_follows = session.query(Follow.follower).filter(
            Follow.user_id.in_(student_follows),
            Follow.follower != student_id,
            Follow.status == 'accepted'
        ).distinct().all()
        similar_students.extend([follow.follower for follow in similar_follows])

    # Find students who like the same videos
    if student_video_likes:
        similar_likes = session.query(Like.user_id).filter(
            Like.video_id.in_(student_video_likes),
            Like.user_id != student_id
        ).distinct().all()
        similar_students.extend([like.user_id for like in similar_likes])

    # Find students who view the same videos
    if student_video_views:
        similar_views = session.query(UserView.user_id).filter(
            UserView.video_id.in_(student_video_views),
            UserView.user_id != student_id
        ).distinct().all()
        similar_students.extend([view.user_id for view in similar_views])

    # Count occurrences of each similar student
    similar_student_counts = {}
    for student in similar_students:
        similar_student_counts[student] = similar_student_counts.get(student, 0) + 1

    # Sort by count (descending)
    similar_student_counts = {k: v for k, v in sorted(similar_student_counts.items(), key=lambda item: item[1], reverse=True)}

    # Get top 10 similar students
    top_similar_students = list(similar_student_counts.keys())[:10]

    # Check if these similar students follow the teacher
    follow_count = session.query(func.count(Follow.id)).filter(
        Follow.user_id == teacher_id,
        Follow.follower.in_(top_similar_students),
        Follow.status == 'accepted'
    ).scalar() or 0

    # Get teacher's videos
    video_ids = [video.id for video in session.query(Video.id).filter(Video.user_id == teacher_id).all()]

    # Check if these similar students like the teacher's videos
    like_count = 0
    view_count = 0

    if video_ids:
        like_count = session.query(func.count(Like.id)).filter(
            Like.video_id.in_(video_ids),
            Like.user_id.in_(top_similar_students)
        ).scalar() or 0

        view_count = session.query(func.count(UserView.id)).filter(
            UserView.video_id.in_(video_ids),
            UserView.user_id.in_(top_similar_students)
        ).scalar() or 0

    # Calculate score
    score = follow_count * 5.0 + like_count * 3.0 + view_count * 1.0

    # Normalize score
    if score > 0:
        score = math.log(1 + score)

    logger.info(f"Similarity bonus for teacher {teacher_id}: {score} (similar students: {len(top_similar_students)}, follows: {follow_count}, likes: {like_count}, views: {view_count})")

    return score

def calculate_total_score(session, teacher_id, student_id, matiere_name, level_id):
    """
    Calculate total score for a teacher.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teacher_id (int): Teacher ID
        student_id (int): Student ID
        matiere_name (str): Subject name
        level_id (int): Level ID

    Returns:
        float: Total score
    """
    logger.info(f"Calculating total score for teacher {teacher_id}")

    # Calculate individual scores
    content_score = calculate_content_score(session, teacher_id, matiere_name, level_id)
    popularity_score = calculate_popularity_score(session, teacher_id)
    interaction_score = calculate_interaction_score(session, teacher_id, matiere_name, level_id)
    similarity_bonus = calculate_similarity_bonus(session, teacher_id, student_id)

    # Calculate total score
    total_score = (
        WEIGHTS['content'] * content_score +
        WEIGHTS['popularity'] * popularity_score +
        WEIGHTS['interaction'] * interaction_score +
        WEIGHTS['similarity'] * similarity_bonus
    )

    logger.info(f"Total score for teacher {teacher_id}: {total_score}")

    return total_score
