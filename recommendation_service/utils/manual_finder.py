"""
Utility functions for finding manuals based on level and subject.
"""

import logging
from ..common.config import (
    LEVEL_ID_TO_SCHOOL_LEVEL,
    LEVEL_SUBJECT_TO_MANUEL_MAPPING,
    MATIERE_ID_TO_SUBJECT,
    MANUEL_TO_MATIERE_MAPPING,
    MATIERE_ID_TO_NAME,
    MANUAL_LEVEL_MAPPING
)

logger = logging.getLogger(__name__)

def get_manuals_for_level_and_subject(level_id, subject_name=None, matiere_id=None, session=None):
    """
    Get manual IDs for a given level and subject.

    Args:
        level_id (int): The level ID (1-6)
        subject_name (str, optional): The subject name in Arabic
        matiere_id (int, optional): The matiere ID
        session (SQLAlchemy session, optional): Database session for querying

    Returns:
        list: List of manual IDs
    """
    # Convert level_id to school level if needed
    school_level = LEVEL_ID_TO_SCHOOL_LEVEL.get(level_id, level_id)

    logger.info(f"Finding manuals for level_id={level_id} (school_level={school_level}), "
                f"subject_name={subject_name}, matiere_id={matiere_id}")

    # If we have a matiere_id but no subject_name, try to get the subject name
    if matiere_id and not subject_name:
        subject_name = MATIERE_ID_TO_SUBJECT.get(matiere_id)
        logger.info(f"Converted matiere_id={matiere_id} to subject_name={subject_name}")

    # If we have a subject name, use the mapping
    if subject_name and school_level in LEVEL_SUBJECT_TO_MANUEL_MAPPING:
        level_subjects = LEVEL_SUBJECT_TO_MANUEL_MAPPING[school_level]

        # Check if the exact subject name exists in the mapping
        if subject_name in level_subjects:
            manual_ids = level_subjects[subject_name]
            logger.info(f"Found manual_ids={manual_ids} for level={school_level}, subject={subject_name}")
            return manual_ids

        # Try to find a partial match
        for mapping_subject, manual_ids in level_subjects.items():
            if mapping_subject in subject_name or subject_name in mapping_subject:
                logger.info(f"Found partial match: {mapping_subject} for {subject_name}")
                logger.info(f"Using manual_ids={manual_ids} for level={school_level}, subject={subject_name}")
                return manual_ids

    # If we have a matiere_id but couldn't find manuals by subject name, try to find manuals by matiere_id
    if matiere_id and session:
        from ..models import Manuel

        # Query manuals with the given matiere_id
        manuals = session.query(Manuel).filter_by(material_id=matiere_id).all()

        if manuals:
            manual_ids = [m.id for m in manuals]
            logger.info(f"Found manual_ids={manual_ids} for matiere_id={matiere_id} using database query")
            return manual_ids

    # If we have a matiere_id, try to find manuals using the MANUEL_TO_MATIERE_MAPPING
    if matiere_id:
        manual_ids = [
            manuel_id for manuel_id, mapped_matiere_id in MANUEL_TO_MATIERE_MAPPING.items()
            if mapped_matiere_id == matiere_id
        ]

        if manual_ids:
            logger.info(f"Found manual_ids={manual_ids} for matiere_id={matiere_id} using MANUEL_TO_MATIERE_MAPPING")
            return manual_ids

    # If we couldn't find any manuals, return an empty list
    logger.warning(f"No manuals found for level_id={level_id}, subject_name={subject_name}, matiere_id={matiere_id}")
    return []

def get_matiere_id_from_name(matiere_name, level_id=None, session=None):
    """
    Get matiere_id from matiere name and level_id using MANUAL_LEVEL_MAPPING.

    Args:
        matiere_name (str): The matiere name
        level_id (int, optional): The level ID to filter materials
        session (SQLAlchemy session, optional): Database session for querying

    Returns:
        int: The matiere ID or None if not found
    """
    # Si level_id n'est pas fourni, on ne peut pas utiliser le mapping
    if not level_id:
        logger.warning(f"No level_id provided, cannot use MANUAL_LEVEL_MAPPING")
        return None

    # Normaliser le nom de la matière pour la recherche
    matiere_name = matiere_name.lower().strip() if matiere_name else ""

    # Utiliser directement le mapping MANUAL_LEVEL_MAPPING pour obtenir les material_ids pour ce niveau
    school_level = LEVEL_ID_TO_SCHOOL_LEVEL.get(level_id, level_id)
    material_ids = MANUAL_LEVEL_MAPPING.get(school_level, [])

    if not material_ids:
        logger.warning(f"No material_ids found for level_id={level_id} (school_level={school_level})")
        return None

    logger.info(f"Material IDs for level {level_id}: {material_ids}")

    # Identifier la matière en fonction du nom
    # Mathématiques
    if "رياض" in matiere_name or "math" in matiere_name:
        # Chercher un material_id correspondant aux mathématiques dans le niveau
        math_material_ids = {
            6: 2,   # رياضيات for level 6
            7: 3,   # رياضيات for level 7
            8: 8,   # رياضيات for level 8
            9: 9,   # رياضيات for level 9
            10: 16, # رياضيات for level 10
            11: 18  # رياضيات for level 11
        }

        if school_level in math_material_ids:
            matiere_id = math_material_ids[school_level]
            if matiere_id in material_ids:
                logger.info(f"Found math matiere_id={matiere_id} for level={school_level}")
                return matiere_id

    # Sciences
    elif "علم" in matiere_name or "ايقاظ" in matiere_name or "science" in matiere_name:
        science_material_ids = {
            8: 6,   # الإيقاظ العلمي for level 8
            9: 10,  # الإيقاظ العلمي for level 9
            10: 13, # الإيقاظ العلمي for level 10
            11: 23  # الإيقاظ العلمي for level 11
        }

        if school_level in science_material_ids:
            matiere_id = science_material_ids[school_level]
            if matiere_id in material_ids:
                logger.info(f"Found science matiere_id={matiere_id} for level={school_level}")
                return matiere_id

    # Français
    elif "فرنس" in matiere_name or "french" in matiere_name or "francais" in matiere_name:
        french_material_ids = {
            8: 7,   # الفرنسية for level 8
            9: 11,  # الفرنسية for level 9
            10: 14, # الفرنسية for level 10
            11: 21  # الفرنسية for level 11
        }

        if school_level in french_material_ids:
            matiere_id = french_material_ids[school_level]
            if matiere_id in material_ids:
                logger.info(f"Found french matiere_id={matiere_id} for level={school_level}")
                return matiere_id

    # Arabe
    elif "عرب" in matiere_name or "arabic" in matiere_name or "arabe" in matiere_name:
        arabic_material_ids = {
            6: 1,   # العربية for level 6
            7: 4,   # العربية for level 7
            8: 5,   # العربية for level 8
            9: 12,  # العربية for level 9
            10: 17, # العربية for level 10
            11: 22  # العربية for level 11
        }

        if school_level in arabic_material_ids:
            matiere_id = arabic_material_ids[school_level]
            if matiere_id in material_ids:
                logger.info(f"Found arabic matiere_id={matiere_id} for level={school_level}")
                return matiere_id

    # Sciences sociales
    elif "اجتماع" in matiere_name or "social" in matiere_name:
        social_material_ids = {
            10: 15, # المواد الاجتماعية for level 10
            11: 19  # المواد الاجتماعية for level 11
        }

        if school_level in social_material_ids:
            matiere_id = social_material_ids[school_level]
            if matiere_id in material_ids:
                logger.info(f"Found social studies matiere_id={matiere_id} for level={school_level}")
                return matiere_id

    # Anglais
    elif "انجليز" in matiere_name or "english" in matiere_name:
        if school_level == 11 and 20 in material_ids:
            logger.info(f"Found english matiere_id=20 for level={school_level}")
            return 20

    # Si on a une session, essayer de trouver la matière dans la base de données
    if session:
        try:
            from ..models import Material

            # Récupérer toutes les matières pour ce niveau
            materials = session.query(Material).filter(
                Material.id.in_(material_ids)
            ).all()

            logger.info(f"Found {len(materials)} materials for level {level_id}")

            # Chercher une correspondance par nom
            for material in materials:
                material_name = material.name.lower() if material.name else ""
                if (matiere_name in material_name or
                    material_name in matiere_name or
                    material_name == matiere_name):
                    logger.info(f"Found matching material: id={material.id}, name={material.name}")
                    return material.id
        except Exception as e:
            logger.error(f"Error querying materials: {str(e)}")

    # Si aucune correspondance n'est trouvée, retourner le premier material_id du niveau
    # comme solution de repli (fallback)
    if material_ids:
        fallback_id = material_ids[0]
        logger.warning(f"No exact match found, using fallback matiere_id={fallback_id} for level={school_level}")
        return fallback_id

    # Si aucune correspondance n'est trouvée, retourner None
    logger.warning(f"No matiere_id found for matiere_name={matiere_name}, level_id={level_id}")
    return None
