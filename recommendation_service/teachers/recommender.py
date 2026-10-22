"""
Teacher recommendation functions for the recommendation system.
"""

import logging
from sqlalchemy import func

from recommendation_service.common.db_connector import get_db_session, close_db_session
from recommendation_service.common.config import DEFAULT_TOP_N, TEACHER_ROLE_ID, ACTIVE_STATUS
from recommendation_service.models import User, Video, Manuel, Material, SchoolLevel
from recommendation_service.teachers.filters import filter_active_teachers, filter_teachers_by_subject_and_level, filter_teachers_with_content
from recommendation_service.teachers.ranking import calculate_total_score

logger = logging.getLogger(__name__)

def recommend_teachers(student_id, matiere_name, level_id, top_n=DEFAULT_TOP_N):
    """
    Recommend teachers for a student based on subject and level.

    Args:
        student_id (int): Student ID
        matiere_name (str): Subject name
        level_id (int): Level ID
        top_n (int): Number of recommendations to return

    Returns:
        list: List of recommended teachers with scores
    """
    logger.info(f"Recommending teachers for student {student_id}, subject '{matiere_name}', level {level_id}")

    # Get database session
    session = get_db_session()

    try:
        # Filter teachers by subject and level
        teachers = filter_teachers_by_subject_and_level(session, matiere_name, level_id)

        if not teachers:
            logger.warning(f"No teachers found for subject '{matiere_name}' and level {level_id}")
            return []

        # Filter teachers with content
        teachers_with_content = filter_teachers_with_content(session, teachers, matiere_name, level_id)

        if not teachers_with_content:
            logger.warning(f"No teachers with content found for subject '{matiere_name}' and level {level_id}")
            # Continue with all teachers instead of returning an empty list
            logger.info(f"Using all {len(teachers)} teachers for subject '{matiere_name}' and level {level_id}")
            teachers_with_content = teachers

        # Calculate scores for each teacher
        teacher_scores = []

        for teacher in teachers_with_content:
            score = calculate_total_score(session, teacher.id, student_id, matiere_name, level_id)
            teacher_scores.append((teacher, score))

        # Sort by score (descending)
        teacher_scores.sort(key=lambda x: x[1], reverse=True)

        # Return top n
        top_teachers = teacher_scores[:top_n]

        # Format results
        results = []

        for teacher, score in top_teachers:
            results.append({
                'id': teacher.id,
                'full_name': teacher.full_name,
                'avatar': teacher.avatar,
                'bio': teacher.bio,
                'score': score
            })

        logger.info(f"Returning {len(results)} recommended teachers")

        return results

    finally:
        # Close database session
        close_db_session(session)

def handle_cold_start(matiere_name, level_id, top_n=DEFAULT_TOP_N):
    """
    Handle cold start case when no student ID is provided.

    Args:
        matiere_name (str): Subject name
        level_id (int): Level ID
        top_n (int): Number of recommendations to return

    Returns:
        list: List of recommended teachers
    """
    logger.info(f"Handling cold start for subject '{matiere_name}' and level {level_id}")

    # Get database session
    session = get_db_session()

    try:
        # Filter teachers by subject and level
        teachers = filter_teachers_by_subject_and_level(session, matiere_name, level_id)

        if not teachers:
            logger.warning(f"No teachers found for subject '{matiere_name}' and level {level_id}")
            return []

        # Filter teachers with content
        teachers_with_content = filter_teachers_with_content(session, teachers, matiere_name, level_id)

        if not teachers_with_content:
            logger.warning(f"No teachers with content found for subject '{matiere_name}' and level {level_id}")
            # Continue with all teachers instead of returning an empty list
            logger.info(f"Using all {len(teachers)} teachers for subject '{matiere_name}' and level {level_id}")
            teachers_with_content = teachers

        # Calculate scores for each teacher (without similarity bonus)
        teacher_scores = []

        for teacher in teachers_with_content:
            # Calculate content score
            content_score = session.query(func.count(Video.id)).filter(
                Video.user_id == teacher.id,
                Video.status == 'APPROVED'
            ).scalar() or 0

            # Calculate popularity score
            popularity_score = session.query(func.count(User.id)).join(
                User.followers
            ).filter(
                User.id == teacher.id
            ).scalar() or 0

            # Calculate total score
            score = content_score * 0.6 + popularity_score * 0.4

            teacher_scores.append((teacher, score))

        # Sort by score (descending)
        teacher_scores.sort(key=lambda x: x[1], reverse=True)

        # Return top n
        top_teachers = teacher_scores[:top_n]

        # Format results
        results = []

        for teacher, score in top_teachers:
            results.append({
                'id': teacher.id,
                'full_name': teacher.full_name,
                'avatar': teacher.avatar,
                'bio': teacher.bio,
                'score': score
            })

        logger.info(f"Returning {len(results)} recommended teachers for cold start")

        return results

    finally:
        # Close database session
        close_db_session(session)

def get_teacher_recommendations(student_id, matiere_name, level_id, top_n=DEFAULT_TOP_N):
    """
    Get teacher recommendations for a student.

    Args:
        student_id (int): Student ID
        matiere_name (str): Subject name
        level_id (int): Level ID
        top_n (int): Number of recommendations to return

    Returns:
        list: List of recommended teachers
    """
    logger.info(f"Getting teacher recommendations for student {student_id}, subject '{matiere_name}', level {level_id}")

    # Check if student ID is provided
    if student_id:
        # Use collaborative filtering
        return recommend_teachers(student_id, matiere_name, level_id, top_n)
    else:
        # Handle cold start
        return handle_cold_start(matiere_name, level_id, top_n)
