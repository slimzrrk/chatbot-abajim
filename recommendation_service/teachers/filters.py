"""
Teacher filtering functions for the recommendation system.
"""

import logging
from sqlalchemy import and_, or_
from sqlalchemy.orm import joinedload

from recommendation_service.common.config import TEACHER_ROLE_ID, ACTIVE_STATUS, APPROVED_STATUS, MANUAL_LEVEL_MAPPING
from recommendation_service.models import User, Video, Manuel, Material, SchoolLevel, Webinar, WebinarChapter, UserMatiere, UserLevel, File

logger = logging.getLogger(__name__)

def filter_active_teachers(session):
    """
    Filter active teachers.

    Args:
        session (sqlalchemy.orm.Session): Database session

    Returns:
        list: List of active teachers
    """
    logger.info("Filtering active teachers")

    teachers = session.query(User).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS
    ).all()

    logger.info(f"Found {len(teachers)} active teachers")

    return teachers

def filter_teachers_by_subject_and_level(session, matiere_name, level_id):
    """
    Filter teachers by subject and level.

    Args:
        session (sqlalchemy.orm.Session): Database session
        matiere_name (str): Subject name
        level_id (int): Level ID

    Returns:
        list: List of teachers who teach the specified subject at the specified level
    """
    logger.info(f"Filtering teachers by subject '{matiere_name}' and level {level_id}")

    # Get the list of material IDs for this level
    level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])

    if not level_material_ids:
        logger.warning(f"No material IDs found for level {level_id}")
        return []

    logger.info(f"Material IDs for level {level_id}: {level_material_ids}")

    # Find material by name and level
    logger.info(f"Looking up material by name '{matiere_name}' for level {level_id}")
    material = session.query(Material).filter(
        Material.name == matiere_name,
        Material.id.in_(level_material_ids)
    ).first()

    if not material:
        logger.warning(f"Material '{matiere_name}' not found for level {level_id}")
        return []

    material_id = material.id
    logger.info(f"Found material ID {material_id} for '{matiere_name}' at level {level_id}")

    # Find manuels for this material
    # Note: We're ignoring opt_id since it's always 0
    manuels = session.query(Manuel).filter(
        Manuel.material_id == material_id
    ).all()

    if not manuels:
        logger.warning(f"No manuels found for material ID {material_id}")
        return []

    manuel_ids = [manuel.id for manuel in manuels]
    logger.info(f"Found {len(manuel_ids)} manuels: {manuel_ids}")

    # Find teachers who have videos for these manuels
    teachers_with_videos = session.query(User).join(
        Video, User.id == Video.user_id
    ).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS,
        Video.manuel_id.in_(manuel_ids),
        Video.status == APPROVED_STATUS
    ).distinct().all()

    logger.info(f"Found {len(teachers_with_videos)} teachers with videos")

    # Find teachers who have webinars with chapters and files for this material and level
    # Include all webinars, not just active ones
    teachers_with_webinars = session.query(User).join(
        Webinar, User.id == Webinar.teacher_id
    ).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS,
        Webinar.matiere_id == material_id,
        Webinar.level_id == level_id
    ).distinct().all()

    # Find teachers who have files in webinar chapters for this material and level
    teachers_with_files = session.query(User).join(
        Webinar, User.id == Webinar.teacher_id
    ).join(
        WebinarChapter, Webinar.id == WebinarChapter.webinar_id
    ).join(
        File, WebinarChapter.id == File.chapter_id
    ).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS,
        Webinar.matiere_id == material_id,
        Webinar.level_id == level_id,
        File.status == 'active'
    ).distinct().all()

    logger.info(f"Found {len(teachers_with_files)} teachers with files in webinar chapters")

    logger.info(f"Found {len(teachers_with_webinars)} teachers with webinars")

    # Find teachers who have registered for these manuels
    teachers_with_matiere = session.query(User).join(
        UserMatiere, User.id == UserMatiere.teacher_id
    ).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS,
        UserMatiere.matiere_id.in_(manuel_ids)
    ).distinct().all()

    logger.info(f"Found {len(teachers_with_matiere)} teachers registered for these manuels")

    # Find teachers who have registered for this level
    teachers_with_level = session.query(User).join(
        UserLevel, User.id == UserLevel.teacher_id
    ).filter(
        User.role_id == TEACHER_ROLE_ID,
        User.status == ACTIVE_STATUS,
        UserLevel.level_id == level_id
    ).distinct().all()

    logger.info(f"Found {len(teachers_with_level)} teachers registered for level {level_id}")

    # Combine all teachers
    all_teachers = set(teachers_with_videos + teachers_with_webinars + teachers_with_files + teachers_with_matiere + teachers_with_level)
    logger.info(f"Found {len(all_teachers)} unique teachers after combining")

    return list(all_teachers)

def filter_teachers_with_content(session, teachers, matiere_name, level_id):
    """
    Filter teachers who have content (videos or webinars) for the specified subject and level.

    Args:
        session (sqlalchemy.orm.Session): Database session
        teachers (list): List of teachers to filter
        matiere_name (str): Subject name
        level_id (int): Level ID

    Returns:
        list: List of teachers who have content for the specified subject and level
    """
    logger.info(f"Filtering teachers with content for subject '{matiere_name}' and level {level_id}")

    # Get the list of material IDs for this level
    level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])

    if not level_material_ids:
        logger.warning(f"No material IDs found for level {level_id}")
        return []

    logger.info(f"Material IDs for level {level_id}: {level_material_ids}")

    # Find material by name and level
    logger.info(f"Looking up material by name '{matiere_name}' for level {level_id}")
    material = session.query(Material).filter(
        Material.name == matiere_name,
        Material.id.in_(level_material_ids)
    ).first()

    if not material:
        logger.warning(f"Material '{matiere_name}' not found for level {level_id}")
        return []

    material_id = material.id
    logger.info(f"Found material ID {material_id} for '{matiere_name}' at level {level_id}")

    # Find manuels for this material
    # Note: We're ignoring opt_id since it's always 0
    manuels = session.query(Manuel).filter(
        Manuel.material_id == material_id
    ).all()

    if not manuels:
        logger.warning(f"No manuels found for material ID {material_id}")
        return []

    manuel_ids = [manuel.id for manuel in manuels]

    # Filter teachers who have videos or webinars for these manuels
    teacher_ids = [teacher.id for teacher in teachers]

    teachers_with_content = []

    for teacher_id in teacher_ids:
        # Check if teacher has videos for these manuels
        videos = session.query(Video).filter(
            Video.user_id == teacher_id,
            Video.manuel_id.in_(manuel_ids),
            Video.status == APPROVED_STATUS
        ).count()

        if videos > 0:
            teacher = next((t for t in teachers if t.id == teacher_id), None)
            if teacher:
                teachers_with_content.append(teacher)
                continue

        # Check if teacher has webinars for this material and level (any status)
        webinars = session.query(Webinar).filter(
            Webinar.teacher_id == teacher_id,
            Webinar.matiere_id == material_id,
            Webinar.level_id == level_id
        ).count()

        if webinars > 0:
            teacher = next((t for t in teachers if t.id == teacher_id), None)
            if teacher:
                teachers_with_content.append(teacher)
                continue

        # Check if teacher has files in webinar chapters for this material and level
        files = session.query(File).join(
            WebinarChapter, File.chapter_id == WebinarChapter.id
        ).join(
            Webinar, WebinarChapter.webinar_id == Webinar.id
        ).filter(
            Webinar.teacher_id == teacher_id,
            Webinar.matiere_id == material_id,
            Webinar.level_id == level_id,
            File.status == 'active'
        ).count()

        if files > 0:
            teacher = next((t for t in teachers if t.id == teacher_id), None)
            if teacher:
                teachers_with_content.append(teacher)

    logger.info(f"Found {len(teachers_with_content)} teachers with content")

    return teachers_with_content
