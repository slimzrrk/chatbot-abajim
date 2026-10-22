#!/usr/bin/env python3
"""
API REST pour le service de recommandation.
Ce fichier expose les fonctionnalités du service de recommandation via une API REST.
"""

import os
import logging
import json
import sys
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Ajouter le répertoire actuel au chemin Python
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()

# Créer l'application Flask
app = Flask(__name__)
CORS(app)  # Activer CORS pour toutes les routes

# Configuration de la base de données
from recommendation_service.common.config import DB_CONFIG

# Importer les fonctions de recommandation
from recommendation_service.teachers.recommender import get_teacher_recommendations
from recommendation_service.courses.recommender import recommend_courses

# Importer les modules nécessaires pour les recommandations d'exercices
import logging
import traceback
from collections import namedtuple
from recommendation_service.common.db_connector import get_db_session, close_db_session
from recommendation_service.common.config import (
    APPROVED_STATUS, MANUAL_LEVEL_MAPPING, MATIERE_ID_TO_NAME, MATIERE_ID_TO_SUBJECT,
    LEVEL_SUBJECT_TO_MANUEL_MAPPING, LEVEL_ID_TO_SCHOOL_LEVEL, MANUEL_TO_MATIERE_MAPPING
)
from recommendation_service.models import (
    Video, Manuel, Material, UserView, UserLevel, Like, Follow,
    Webinar, WebinarTranslation, WebinarChapter, File, FileTranslation, User
)
from recommendation_service.utils.manual_finder import get_manuals_for_level_and_subject, get_matiere_id_from_name

def get_exercise_recommendations(user_id, matiere_id=None, level_id=None, limit=5):
    """
    Recommande des exercices vidéos pour un utilisateur en utilisant la base de données.

    Args:
        user_id (int): ID de l'utilisateur
        matiere_id (int, optional): ID de la matière pour filtrer les recommandations
        level_id (int, optional): ID du niveau pour filtrer les recommandations
        limit (int, optional): Nombre de recommandations à retourner. Défaut: 5

    Returns:
        tuple: (liste d'objets Video recommandés, liste des scores correspondants)
    """
    logger.info(f"🔍 Recommending exercises for user {user_id}, matiere_id={matiere_id}, level_id={level_id}")

    # Obtenir une session de base de données
    session = get_db_session()

    try:
        # Étape 1: Récupérer le niveau de l'utilisateur s'il n'est pas fourni
        if not level_id:
            user_level = session.query(UserLevel).filter_by(user_id=user_id).first()
            if user_level:
                level_id = user_level.level_id
                logger.info(f"Found user level: {level_id}")
            else:
                logger.warning(f"No level found for user {user_id}")
                # Utiliser le cold start si aucun niveau n'est trouvé
                return handle_exercise_cold_start(session, matiere_id=matiere_id, limit=limit)

        # Étape 2: Récupérer les IDs des manuels correspondant au niveau et à la matière
        manuel_ids = []

        if level_id:
            logger.info(f"Finding manuals for level_id={level_id} and matiere_id={matiere_id}")

            # Convertir level_id en school_level si nécessaire
            school_level = LEVEL_ID_TO_SCHOOL_LEVEL.get(level_id, level_id)
            logger.info(f"Converted level_id={level_id} to school_level={school_level}")

            # Utiliser le mapping explicite entre niveau, matière et manuels
            if school_level in LEVEL_SUBJECT_TO_MANUEL_MAPPING:
                level_subjects = LEVEL_SUBJECT_TO_MANUEL_MAPPING.get(school_level, {})

                # Si nous avons un matiere_id, essayer de trouver le nom de la matière
                subject_name = MATIERE_ID_TO_SUBJECT.get(matiere_id)
                logger.info(f"Matiere_id={matiere_id} corresponds to subject={subject_name}")

                if subject_name and subject_name in level_subjects:
                    # Récupérer les IDs des manuels pour cette matière et ce niveau
                    manuel_ids = level_subjects.get(subject_name, [])
                    logger.info(f"Using mapping: school_level={school_level}, subject={subject_name} -> manuel_ids={manuel_ids}")
                elif matiere_id:
                    # Si la matière n'est pas dans le mapping pour ce niveau, vérifier si elle existe
                    matiere = session.query(Material).filter_by(id=matiere_id).first()
                    if matiere:
                        logger.warning(f"No manuals found in mapping for matiere_id={matiere_id} ({matiere.name}) at level {level_id}")

                        # Essayer de trouver des manuels pour cette matière directement
                        manuels_for_matiere = session.query(Manuel).filter_by(material_id=matiere_id).all()
                        if manuels_for_matiere:
                            manuel_ids = [m.id for m in manuels_for_matiere]
                            logger.info(f"Found {len(manuel_ids)} manuals directly for matiere_id={matiere_id}: {manuel_ids}")
                        else:
                            # Utiliser le cold start si aucun manuel n'est trouvé pour cette matière
                            logger.warning(f"No manuals found directly for matiere_id={matiere_id}")
                            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
                    else:
                        logger.warning(f"Matiere with ID {matiere_id} not found")
                        # Utiliser le cold start si la matière n'existe pas
                        return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)
                else:
                    # Si aucune matière n'est spécifiée, utiliser tous les manuels pour ce niveau
                    for subject_manuels in level_subjects.values():
                        manuel_ids.extend(subject_manuels)
                    logger.info(f"Using all manuals for school_level={school_level}: manuel_ids={manuel_ids}")
            else:
                logger.warning(f"Level {level_id} not found in mapping")

                # Utiliser l'ancienne méthode comme fallback
                if level_id in MANUAL_LEVEL_MAPPING:
                    # Récupérer les material_ids pour ce niveau
                    level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])
                    logger.info(f"Fallback: Level {level_id} corresponds to material_ids: {level_material_ids}")

                    # Construire la requête pour les manuels
                    manuel_query = session.query(Manuel)

                    # Filtrer par material_ids du niveau
                    if level_material_ids:
                        manuel_query = manuel_query.filter(Manuel.material_id.in_(level_material_ids))

                    # Récupérer tous les manuels pour ce niveau
                    manuels = manuel_query.all()
                    logger.info(f"Found {len(manuels)} manuals for level {level_id}")

                    # Si un ID de matière est fourni, filtrer les manuels par cet ID
                    if matiere_id:
                        filtered_manuels = [m for m in manuels if m.material_id == matiere_id]
                        logger.info(f"Filtered to {len(filtered_manuels)} manuals with matiere_id={matiere_id}")

                        # Si aucun manuel ne correspond à cette matière, utiliser le cold start
                        if not filtered_manuels:
                            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)

                        # Utiliser les manuels filtrés
                        manuels = filtered_manuels

                    # Extraire les IDs des manuels
                    manuel_ids = [m.id for m in manuels]

            # Si nous avons des manuel_ids, récupérer les informations sur ces manuels
            if manuel_ids:
                manuels = session.query(Manuel).filter(Manuel.id.in_(manuel_ids)).all()

                # Afficher les informations sur les manuels sélectionnés
                for manuel in manuels:
                    material = session.query(Material).filter_by(id=manuel.material_id).first()
                    material_name = material.name if material else "Unknown"
                    logger.info(f"Selected manual: id={manuel.id}, name={manuel.name}, material_id={manuel.material_id} ({material_name})")

                logger.info(f"Using manuel_ids: {manuel_ids}")
            else:
                logger.warning(f"No manuals found for level_id={level_id} and matiere_id={matiere_id}")
                # Utiliser le cold start si aucun manuel n'est trouvé
                return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)

        if not manuel_ids:
            logger.warning(f"No manuals found for matiere_id={matiere_id} and level_id={level_id}")
            # Utiliser le cold start si aucun manuel n'est trouvé
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)

        # Étape 3: Récupérer les vidéos disponibles
        videos_query = session.query(Video).filter(
            Video.status == APPROVED_STATUS,
            Video.manuel_id.in_(manuel_ids)
        )

        # Afficher les informations sur la requête
        logger.info(f"Querying videos with manuel_ids: {manuel_ids}")

        # Étape 4: Exclure les vidéos déjà vues par l'utilisateur
        viewed_video_ids = session.query(UserView.video_id).filter_by(user_id=user_id).all()
        viewed_video_ids = [v[0] for v in viewed_video_ids]

        if viewed_video_ids:
            videos_query = videos_query.filter(~Video.id.in_(viewed_video_ids))
            logger.info(f"Excluding {len(viewed_video_ids)} already viewed videos")

        # Exécuter la requête
        videos = videos_query.all()
        logger.info(f"Found {len(videos)} unseen videos for user {user_id}")

        # Afficher des informations sur les vidéos trouvées
        for video in videos[:5]:  # Limiter à 5 pour éviter de surcharger les logs
            manuel = session.query(Manuel).filter_by(id=video.manuel_id).first()
            manuel_name = manuel.name if manuel else "Unknown"
            material_id = manuel.material_id if manuel else None
            material = session.query(Material).filter_by(id=material_id).first() if material_id else None
            material_name = material.name if material else "Unknown"

            logger.info(f"Video: id={video.id}, manuel_id={video.manuel_id} ({manuel_name}), material_id={material_id} ({material_name})")

        if not videos:
            logger.warning(f"No unseen videos found for user {user_id}")
            # Utiliser le cold start si aucune vidéo non vue n'est trouvée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)

        # Étape 5: Récupérer la dernière vidéo vue par l'utilisateur (pour la proximité pédagogique)
        last_viewed = session.query(UserView).join(Video).filter(
            UserView.user_id == user_id
        ).order_by(UserView.updated_at.desc()).first()

        last_viewed_video = None
        if last_viewed:
            last_viewed_video = session.query(Video).filter_by(id=last_viewed.video_id).first()

        # Étape 6: Calculer les scores pour chaque vidéo
        scored_videos = []

        for video in videos:
            # Score de base: popularité
            popularity_score = (video.vues * 0.5) + (video.likes * 2.0)

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
                Follow.follower == user_id,
                Follow.user_id == video.user_id
            ).first()

            if is_following:
                teacher_follow_bonus = 1.5

            # Score total
            total_score = popularity_score + (proximity_score * 3.0) + teacher_follow_bonus

            scored_videos.append((video, total_score))

        # Étape 7: Trier par score décroissant
        scored_videos.sort(key=lambda x: x[1], reverse=True)

        # Étape 8: Retourner les top N recommandations
        top_videos = scored_videos[:limit]

        if not top_videos:
            logger.warning("No videos to recommend")
            # Utiliser le cold start si aucune vidéo n'est recommandée
            return handle_exercise_cold_start(session, matiere_id=matiere_id, level_id=level_id, user_id=user_id, limit=limit)

        recommended_videos, scores = zip(*top_videos)
        logger.info(f"Returning {len(recommended_videos)} recommended videos")

        return recommended_videos, scores

    except Exception as e:
        logger.error(f"❌ Error in get_exercise_recommendations: {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return [], []

    finally:
        # Fermer la session de base de données
        close_db_session(session)

def get_advanced_exercise_recommendations(user_id, matiere_name=None, level_id=None, limit=5):
    """
    Version avancée de la recommandation d'exercices utilisant le filtrage collaboratif
    et la proximité pédagogique.

    Args:
        user_id (int): ID de l'utilisateur
        matiere_name (str, optional): Nom de la matière pour filtrer les recommandations
        level_id (int, optional): ID du niveau pour filtrer les recommandations
        limit (int, optional): Nombre de recommandations à retourner. Défaut: 5

    Returns:
        tuple: (liste d'objets Video recommandés, liste des scores correspondants)
    """
    logger.info(f"🔍 Advanced exercise recommendation for user {user_id}, matiere={matiere_name}, level_id={level_id}")

    # Obtenir une session de base de données
    session = get_db_session()

    try:
        # Étape 1: Récupérer le niveau de l'utilisateur s'il n'est pas fourni
        if not level_id:
            user_level = session.query(UserLevel).filter_by(user_id=user_id).first()
            if user_level:
                level_id = user_level.level_id
                logger.info(f"Found user level: {level_id}")
            else:
                logger.warning(f"No level found for user {user_id}")
                # Utiliser le cold start si aucun niveau n'est trouvé
                return handle_exercise_cold_start(session, matiere_name=matiere_name, limit=limit)

        # Étape 2: Récupérer l'ID de la matière si le nom est fourni
        matiere_id = None
        if matiere_name:
            # Normaliser le nom de la matière
            real_matiere_name = normalize_matiere_name(matiere_name)
            logger.info(f"Normalized matiere_name: '{matiere_name}' -> '{real_matiere_name}'")

            # Récupérer les material_ids pour ce niveau
            level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])
            logger.info(f"Level {level_id} corresponds to material_ids: {level_material_ids}")

            if not level_material_ids:
                logger.warning(f"No material_ids found for level {level_id}")
                return handle_exercise_cold_start(session, matiere_name=real_matiere_name, level_id=level_id, user_id=user_id, limit=limit)

            # Trouver les matières correspondant au nom
            matieres = session.query(Material).filter(
                Material.name == real_matiere_name
            ).all()

            logger.info(f"Found {len(matieres)} materials with name: {real_matiere_name}")

            # Trouver les matières qui correspondent à ce niveau et au nom demandé
            matching_materials = []
            for matiere in matieres:
                if matiere.id in level_material_ids:
                    matching_materials.append(matiere)
                    logger.info(f"Found matching material: id={matiere.id}, name={matiere.name}, section_id={matiere.section_id}")

            logger.info(f"Found {len(matching_materials)} matching materials for name: {real_matiere_name} and level: {level_id}")

            # Si nous avons trouvé des matières correspondantes, utiliser la première
            if matching_materials:
                matiere_id = matching_materials[0].id
                logger.info(f"Using matiere ID: {matiere_id} for {real_matiere_name} at level {level_id}")
            else:
                # Si aucune correspondance exacte n'est trouvée, vérifier les manuels associés aux material_ids du niveau
                manuels = session.query(Manuel).filter(
                    Manuel.material_id.in_(level_material_ids)
                ).all()

                logger.info(f"Found {len(manuels)} manuals for level {level_id}")

                # Récupérer les matières associées à ces manuels
                manuel_material_ids = [m.material_id for m in manuels]
                materials_for_manuels = session.query(Material).filter(
                    Material.id.in_(manuel_material_ids)
                ).all()

                logger.info(f"Found {len(materials_for_manuels)} materials for these manuals")

                # Trouver les matières qui correspondent au nom demandé
                for material in materials_for_manuels:
                    if material.name == real_matiere_name or real_matiere_name in material.name:
                        matiere_id = material.id
                        logger.info(f"Found matching matiere ID: {matiere_id} for {real_matiere_name}")
                        break

                # Si toujours pas de correspondance, essayer une recherche plus large
                if not matiere_id:
                    for material in materials_for_manuels:
                        if "رياض" in material.name and (real_matiere_name == "رياضيات" or "رياض" in real_matiere_name):
                            matiere_id = material.id
                            logger.info(f"Found math matiere ID: {matiere_id} for {real_matiere_name}")
                            break
                        elif "فرنس" in material.name and (real_matiere_name == "الفرنسية" or "فرنس" in real_matiere_name):
                            matiere_id = material.id
                            logger.info(f"Found french matiere ID: {matiere_id} for {real_matiere_name}")
                            break
                        elif "عرب" in material.name and (real_matiere_name == "العربية" or "عرب" in real_matiere_name):
                            matiere_id = material.id
                            logger.info(f"Found arabic matiere ID: {matiere_id} for {real_matiere_name}")
                            break
                        elif "علم" in material.name and (real_matiere_name == "الإيقاظ العلمي" or "علم" in real_matiere_name):
                            matiere_id = material.id
                            logger.info(f"Found science matiere ID: {matiere_id} for {real_matiere_name}")
                            break

            if not matiere_id and matieres:
                # Si aucune matière n'a été trouvée pour ce niveau mais qu'il y a des matières avec ce nom,
                # vérifier si l'une d'entre elles a un manuel dans les material_ids du niveau
                for matiere in matieres:
                    manuels_for_matiere = session.query(Manuel).filter(
                        Manuel.material_id == matiere.id
                    ).all()

                    if manuels_for_matiere:
                        matiere_id = matiere.id
                        logger.info(f"Using matiere ID: {matiere_id} for {real_matiere_name} (has manuals)")
                        break

            if not matiere_id:
                logger.warning(f"No matiere found with name: {real_matiere_name}")
                # Utiliser le cold start si aucune matière n'est trouvée
                return handle_exercise_cold_start(session, matiere_name=real_matiere_name, level_id=level_id, user_id=user_id, limit=limit)

        # Si nous avons trouvé un ID de matière, utiliser la fonction de base
        if matiere_id:
            return get_exercise_recommendations(user_id, matiere_id, level_id, limit)

        # Sinon, retourner une liste vide
        logger.warning(f"No matiere found with name: {matiere_name}")
        return [], []

    except Exception as e:
        logger.error(f"❌ Error in get_advanced_exercise_recommendations: {str(e)}")
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return [], []

    finally:
        # Fermer la session de base de données
        close_db_session(session)

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

    # Si nous avons un nom de matière mais pas d'ID, essayer de trouver l'ID
    if matiere_name and not matiere_id:
        # Normaliser le nom de la matière
        matiere_name = normalize_matiere_name(matiere_name)
        logger.info(f"Normalized matiere_name: {matiere_name}")

        # Essayer de trouver l'ID de la matière à partir du nom
        matiere_id = get_matiere_id_from_name(matiere_name)
        logger.info(f"Found matiere_id={matiere_id} for matiere_name={matiere_name}")

    # Récupérer les IDs des manuels correspondant au niveau et à la matière
    manuel_ids = get_manuals_for_level_and_subject(level_id, matiere_name, matiere_id, session)
    logger.info(f"Found manuel_ids={manuel_ids} for level_id={level_id}, matiere_name={matiere_name}, matiere_id={matiere_id}")

    # Si aucun manuel n'est trouvé, essayer de trouver des manuels pour des matières similaires
    if not manuel_ids and matiere_id:
        # Récupérer le nom de la matière
        matiere = session.query(Material).filter_by(id=matiere_id).first()
        matiere_name = matiere.name if matiere else None
        logger.info(f"No manuals found for matiere_id={matiere_id} ({matiere_name}) at level {level_id}")

        # Essayer de trouver des matières similaires
        similar_materials = []

        if matiere_id == 9 or (matiere_name and "رياض" in matiere_name):  # Mathématiques
            similar_materials = session.query(Material).filter(Material.name.like("%رياض%")).all()
        elif matiere_id == 10 or (matiere_name and "علم" in matiere_name):  # Sciences
            similar_materials = session.query(Material).filter(Material.name.like("%علم%")).all()
        elif matiere_id == 11 or (matiere_name and "فرنس" in matiere_name):  # Français
            similar_materials = session.query(Material).filter(Material.name.like("%فرنس%")).all()
        elif matiere_id == 12 or (matiere_name and "عرب" in matiere_name):  # Arabe
            similar_materials = session.query(Material).filter(Material.name.like("%عرب%")).all()

        logger.info(f"Found {len(similar_materials)} similar materials")

        # Si nous avons trouvé des matières similaires, essayer de trouver des manuels pour ces matières
        if similar_materials:
            similar_material_ids = [m.id for m in similar_materials]

            # Récupérer les manuels pour ces matières
            similar_manuels = session.query(Manuel).filter(
                Manuel.material_id.in_(similar_material_ids)
            ).all()

            # Extraire les IDs des manuels
            manuel_ids = [m.id for m in similar_manuels]
            logger.info(f"Found {len(manuel_ids)} manuals for similar materials: {manuel_ids}")

    # Si nous n'avons toujours pas de manuel_ids, utiliser tous les manuels pour ce niveau
    if not manuel_ids and level_id:
        # Récupérer les material_ids pour ce niveau
        level_material_ids = MANUAL_LEVEL_MAPPING.get(level_id, [])

        # Récupérer tous les manuels pour ce niveau
        all_level_manuels = session.query(Manuel).filter(
            Manuel.material_id.in_(level_material_ids)
        ).all()

        # Extraire les IDs des manuels
        manuel_ids = [m.id for m in all_level_manuels]
        logger.info(f"Using all manuals for level {level_id}: {manuel_ids}")

    # Si nous avons un nom de matière mais toujours pas de manuel_ids, essayer de trouver des manuels par nom
    elif matiere_name and not manuel_ids:
        # Normaliser le nom de la matière
        real_matiere_name = normalize_matiere_name(matiere_name)
        logger.info(f"Normalized matiere_name: '{matiere_name}' -> '{real_matiere_name}'")

        # Essayer de trouver des matières correspondant au nom
        materials = session.query(Material).filter(
            Material.name.like(f"%{real_matiere_name}%")
        ).all()

        logger.info(f"Found {len(materials)} materials matching '{real_matiere_name}'")

        if materials:
            # Récupérer les manuels pour ces matières
            material_ids = [m.id for m in materials]
            manuels = session.query(Manuel).filter(
                Manuel.material_id.in_(material_ids)
            ).all()

            # Extraire les IDs des manuels
            manuel_ids = [m.id for m in manuels]
            logger.info(f"Found {len(manuel_ids)} manuals for matching materials: {manuel_ids}")

            # Afficher les informations sur les manuels sélectionnés
            for manuel in manuels[:5]:  # Limiter à 5 pour éviter de surcharger les logs
                material = session.query(Material).filter_by(id=manuel.material_id).first()
                material_name = material.name if material else "Unknown"
                logger.info(f"Selected manual: id={manuel.id}, name={manuel.name}, material_id={manuel.material_id} ({material_name})")
        else:
            # Si aucune matière n'est trouvée, essayer une recherche plus large
            if "رياض" in real_matiere_name or "math" in real_matiere_name.lower():
                # Mathématiques
                materials = session.query(Material).filter(Material.name.like("%رياض%")).all()
            elif "فرنس" in real_matiere_name or "french" in real_matiere_name.lower():
                # Français
                materials = session.query(Material).filter(Material.name.like("%فرنس%")).all()
            elif "عرب" in real_matiere_name or "arabic" in real_matiere_name.lower():
                # Arabe
                materials = session.query(Material).filter(Material.name.like("%عرب%")).all()
            elif "علم" in real_matiere_name or "science" in real_matiere_name.lower():
                # Sciences
                materials = session.query(Material).filter(Material.name.like("%علم%")).all()

            logger.info(f"Found {len(materials)} materials using broader search")

            if materials:
                # Récupérer les manuels pour ces matières
                material_ids = [m.id for m in materials]
                manuels = session.query(Manuel).filter(
                    Manuel.material_id.in_(material_ids)
                ).all()

                # Extraire les IDs des manuels
                manuel_ids = [m.id for m in manuels]
                logger.info(f"Found {len(manuel_ids)} manuals for broader search: {manuel_ids}")

                # Afficher les informations sur les manuels sélectionnés
                for manuel in manuels[:5]:  # Limiter à 5 pour éviter de surcharger les logs
                    material = session.query(Material).filter_by(id=manuel.material_id).first()
                    material_name = material.name if material else "Unknown"
                    logger.info(f"Selected manual: id={manuel.id}, name={manuel.name}, material_id={manuel.material_id} ({material_name})")

        logger.info(f"Using {len(manuel_ids)} manuel_ids for cold start")

    if not manuel_ids:
        logger.warning(f"No manuals found for the specified criteria")
        return [], []

    # Récupérer les enseignants suivis par l'utilisateur
    followed_teachers = []
    if user_id:
        followed_teachers = session.query(Follow.user_id).filter(
            Follow.follower == user_id
        ).all()
        followed_teachers = [t[0] for t in followed_teachers]

    # Construire la requête pour les vidéos populaires
    query = session.query(Video).filter(
        Video.status == APPROVED_STATUS,
        Video.manuel_id.in_(manuel_ids)
    )

    # Trier par popularité
    query = query.order_by((Video.vues * 0.5 + Video.likes * 2.0).desc())

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

# Fonction pour normaliser les noms de matières
def normalize_matiere_name(name):
    """
    Normalise le nom d'une matière pour correspondre aux noms dans la base de données.

    Args:
        name (str): Nom de la matière à normaliser

    Returns:
        str: Nom normalisé de la matière
    """
    if not name:
        return name

    # Conversion en minuscules et suppression des espaces
    name = name.lower().strip()

    # Mappings pour les matières en arabe
    matiere_mappings = {
        # Mathématiques
        'رياضيات': 'رياضيات',
        'رياضة': 'رياضيات',
        'رياض': 'رياضيات',
        'math': 'رياضيات',
        'mathematics': 'رياضيات',

        # Français
        'فرنسية': 'الفرنسية',
        'فرنساوي': 'الفرنسية',
        'français': 'الفرنسية',
        'francais': 'الفرنسية',
        'french': 'الفرنسية',

        # Arabe
        'عربية': 'العربية',
        'عربي': 'العربية',
        'arabe': 'العربية',
        'arabic': 'العربية',

        # Sciences
        'علوم': 'الإيقاظ العلمي',
        'إيقاظ': 'الإيقاظ العلمي',
        'الإيقاظ': 'الإيقاظ العلمي',
        'science': 'الإيقاظ العلمي',
        'sciences': 'الإيقاظ العلمي',

        # Anglais
        'إنجليزية': 'الإنجليزية',
        'انجليزي': 'الإنجليزية',
        'english': 'الإنجليزية',

        # Sciences sociales
        'اجتماعيات': 'المواد الاجتماعية',
        'social': 'المواد الاجتماعية',
        'social studies': 'المواد الاجتماعية',
    }

    # Recherche dans les mappings
    for key, value in matiere_mappings.items():
        if name == key or name.startswith(key) or key in name:
            return value

    # Si aucun mapping n'est trouvé, retourner le nom original
    return name

@app.route('/', methods=['GET'])
def root():
    """Endpoint racine."""
    return jsonify({
        'status': 'ok',
        'message': 'Recommendation API is running',
        'version': '1.0.0'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Vérifier l'état de santé de l'API."""
    return jsonify({
        'status': 'ok',
        'service': 'recommendation-api',
        'version': '1.0.0',
        'database': DB_CONFIG['database'],
        'host': DB_CONFIG['host']
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """Vérifier l'état de santé de l'API (endpoint alternatif)."""
    return health_check()

@app.route('/api/recommendations/teachers', methods=['GET'])
def recommend_teachers_api():
    """
    Recommander des professeurs pour un étudiant.

    Paramètres de requête:
    - student_id (int, optionnel): ID de l'étudiant
    - matiere_name (str, obligatoire): Nom de la matière
    - level_id (int, obligatoire): ID du niveau
    - top_n (int, optionnel): Nombre de recommandations à retourner (défaut: 5)

    Retourne:
    - Liste des professeurs recommandés
    """
    # Récupérer les paramètres de la requête
    student_id = request.args.get('student_id', type=int)
    matiere_name = request.args.get('matiere_name')
    level_id = request.args.get('level_id', type=int)
    top_n = request.args.get('top_n', default=5, type=int)

    # Vérifier les paramètres obligatoires
    if not matiere_name or not level_id:
        return jsonify({
            'error': 'Missing required parameters',
            'required': ['matiere_name', 'level_id']
        }), 400

    # Normaliser le nom de la matière
    original_matiere_name = matiere_name
    matiere_name = normalize_matiere_name(matiere_name)

    # Correction pour les problèmes d'encodage
    if matiere_name == 'Ø±ÙØ§Ø¶ÙØ§Øª':
        matiere_name = 'رياضيات'

    logger.info(f"Normalized matiere_name: '{original_matiere_name}' -> '{matiere_name}'")

    logger.info(f"Received request for teacher recommendations: student_id={student_id}, matiere_name={matiere_name}, level_id={level_id}")

    try:
        # Obtenir les recommandations
        recommendations = get_teacher_recommendations(student_id, matiere_name, level_id, top_n)

        # Retourner les recommandations
        return jsonify({
            'student_id': student_id,
            'matiere': matiere_name,
            'level_id': level_id,
            'recommendations': recommendations
        })
    except Exception as e:
        logger.error(f"Error in recommend_teachers: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/api/recommendations/exercises', methods=['GET'])
def recommend_exercises():
    """
    Recommander des exercices pour un étudiant.

    Paramètres de requête:
    - student_id (int, obligatoire): ID de l'étudiant
    - matiere_name (str, obligatoire): Nom de la matière
    - level_id (int, obligatoire): ID du niveau
    - top_n (int, optionnel): Nombre de recommandations à retourner (défaut: 5)

    Retourne:
    - Liste des exercices recommandés
    """
    # Récupérer les paramètres de la requête
    student_id = request.args.get('student_id', type=int)
    matiere_name = request.args.get('matiere_name')
    matiere_id = request.args.get('matiere_id', type=int)
    level_id = request.args.get('level_id', type=int)
    top_n = request.args.get('top_n', default=5, type=int)

    # Vérifier les paramètres obligatoires
    if not student_id:
        return jsonify({
            'error': 'Missing required parameter: student_id',
            'required': ['student_id']
        }), 400

    if not matiere_name and not matiere_id:
        return jsonify({
            'error': 'Missing required parameter: matiere_name or matiere_id',
            'required': ['matiere_name or matiere_id']
        }), 400

    # Normaliser le nom de la matière si fourni
    if matiere_name:
        original_matiere_name = matiere_name
        matiere_name = normalize_matiere_name(matiere_name)
        logger.info(f"Normalized matiere_name: '{original_matiere_name}' -> '{matiere_name}'")

        # Utiliser notre fonction utilitaire pour obtenir le matiere_id
        if not matiere_id:
            matiere_id = get_matiere_id_from_name(matiere_name)
            logger.info(f"Found matiere_id={matiere_id} for matiere_name={matiere_name}")

    # Si nous avons toujours un nom de matière mais pas d'ID, essayer de le déduire
    if matiere_name and not matiere_id:
        # Pour les mathématiques
        if "رياض" in matiere_name or "math" in matiere_name.lower():
            matiere_id = 9
            logger.info(f"Forcing matiere_id=9 for mathematics based on matiere_name: {matiere_name}")
        # Pour les sciences
        elif "علم" in matiere_name or "ايقاظ" in matiere_name or "science" in matiere_name.lower():
            matiere_id = 10
            logger.info(f"Forcing matiere_id=10 for science based on matiere_name: {matiere_name}")
        # Pour le français
        elif "فرنس" in matiere_name or "french" in matiere_name.lower() or "francais" in matiere_name.lower():
            matiere_id = 11
            logger.info(f"Forcing matiere_id=11 for french based on matiere_name: {matiere_name}")
        # Pour l'arabe
        elif "عرب" in matiere_name or "arabic" in matiere_name.lower() or "arabe" in matiere_name.lower():
            matiere_id = 12
            logger.info(f"Forcing matiere_id=12 for arabic based on matiere_name: {matiere_name}")

    logger.info(f"Received request for exercise recommendations: student_id={student_id}, matiere_name={matiere_name}, matiere_id={matiere_id}, level_id={level_id}")

    try:
        # Obtenir les recommandations
        try:
            # Utiliser la fonction de base avec l'ID de matière
            logger.info(f"Using exercise recommendations with matiere_id: {matiere_id}, level_id: {level_id}")
            recommendations, scores = get_exercise_recommendations(student_id, matiere_id, level_id, top_n)

            # Si nous n'avons pas de recommandations et que nous avons un nom de matière, essayer avec le nom
            if not recommendations and matiere_name:
                logger.info(f"No recommendations found with matiere_id={matiere_id}, trying with matiere_name={matiere_name}")

                # Obtenir les manuel_ids pour ce niveau et cette matière
                manuel_ids = get_manuals_for_level_and_subject(level_id, matiere_name, matiere_id, get_db_session())
                logger.info(f"Found manuel_ids={manuel_ids} for level_id={level_id}, matiere_name={matiere_name}")

                if manuel_ids:
                    # Utiliser le cold start avec ces manuel_ids
                    session = get_db_session()
                    try:
                        recommendations, scores = handle_exercise_cold_start(session, matiere_id=matiere_id, matiere_name=matiere_name, level_id=level_id, user_id=student_id, limit=top_n)
                        logger.info(f"Found {len(recommendations)} recommendations using cold start")
                    finally:
                        close_db_session(session)

            # Filtrer les recommandations par matière si matiere_id est défini
            if matiere_id and recommendations:
                filtered_recommendations = []
                filtered_scores = []

                for i, rec in enumerate(recommendations):
                    # Récupérer les informations sur le manuel et la matière
                    session = get_db_session()
                    try:
                        manuel = session.query(Manuel).filter_by(id=rec.manuel_id).first()
                        if manuel:
                            # Vérifier si le manuel correspond à la matière demandée
                            if manuel.material_id == matiere_id:
                                filtered_recommendations.append(rec)
                                filtered_scores.append(scores[i])
                                logger.info(f"Including video id={rec.id}, manuel_id={rec.manuel_id}, material_id={manuel.material_id}")
                            else:
                                logger.info(f"Excluding video id={rec.id}, manuel_id={rec.manuel_id}, material_id={manuel.material_id} (not matching matiere_id={matiere_id})")
                    finally:
                        close_db_session(session)

                logger.info(f"Filtered from {len(recommendations)} to {len(filtered_recommendations)} recommendations based on matiere_id={matiere_id}")
                recommendations = filtered_recommendations
                scores = filtered_scores

            # Préparer la réponse
            serialized_recommendations = []
            for i, rec in enumerate(recommendations):
                # Récupérer les informations sur le manuel et la matière
                session = get_db_session()
                try:
                    manuel = session.query(Manuel).filter_by(id=rec.manuel_id).first()
                    manuel_name = manuel.name if manuel else None
                    material_id = manuel.material_id if manuel else None
                    material = session.query(Material).filter_by(id=material_id).first() if material_id else None
                    material_name = material.name if material else None

                    teacher = session.query(User).filter_by(id=rec.user_id).first()
                    teacher_name = teacher.full_name if teacher else None
                    teacher_avatar = teacher.avatar if teacher else None
                finally:
                    close_db_session(session)

                serialized_recommendations.append({
                    'id': rec.id,
                    'titre': rec.titleAll,  # ✅ Utiliser titleAll au lieu de titre
                    'video': rec.video,  # ✅ Ajout de l'URL de la vidéo
                    'description': rec.description,
                    'page': rec.page,
                    'manuel_id': rec.manuel_id,
                    'manuel_name': manuel_name,
                    'material_id': material_id,
                    'material_name': material_name,
                    'thumbnail': rec.thumbnail,
                    'user_id': rec.user_id,
                    'teacher_name': teacher_name,
                    'teacher_avatar': teacher_avatar,
                    'teacher': {
                        'id': rec.user_id,
                        'name': teacher_name or 'مدرس غير معروف',
                        'full_name': teacher_name or 'مدرس غير معروف',
                        'avatar': teacher_avatar or '/default-avatar.jpg',
                        'followers': []
                    },
                    'vues': rec.vues,
                    'likes': rec.likes,
                    'score': round(scores[i], 2) if i < len(scores) else None
                })

            logger.info(f"✅ Successfully retrieved {len(serialized_recommendations)} exercise recommendations")
        except Exception as e:
            logger.error(f"❌ Error calling get_exercise_recommendations: {str(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")

            # Retourner une liste vide en cas d'erreur
            serialized_recommendations = []

        # Retourner les recommandations
        return jsonify({
            'student_id': student_id,
            'matiere': matiere_name,
            'matiere_id': matiere_id,
            'level_id': level_id,
            'count': len(serialized_recommendations),
            'recommendations': serialized_recommendations
        })
    except Exception as e:
        logger.error(f"Error in recommend_exercises: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/api/recommendations/advanced-exercises', methods=['GET'])
def recommend_advanced_exercises():
    """
    Recommander des exercices avancés pour un étudiant en utilisant le filtrage collaboratif.

    Paramètres de requête:
    - student_id (int, obligatoire): ID de l'étudiant
    - matiere_name (str, obligatoire): Nom de la matière
    - level_id (int, obligatoire): ID du niveau
    - top_n (int, optionnel): Nombre de recommandations à retourner (défaut: 5)

    Retourne:
    - Liste des exercices recommandés avec filtrage collaboratif
    """
    # Récupérer les paramètres de la requête
    student_id = request.args.get('student_id', type=int)
    matiere_name = request.args.get('matiere_name')
    level_id = request.args.get('level_id', type=int)
    top_n = request.args.get('top_n', default=5, type=int)

    # Vérifier les paramètres obligatoires
    if not student_id:
        return jsonify({
            'error': 'Missing required parameter: student_id',
            'required': ['student_id']
        }), 400

    if not matiere_name:
        return jsonify({
            'error': 'Missing required parameter: matiere_name',
            'required': ['matiere_name']
        }), 400

    # Normaliser le nom de la matière
    original_matiere_name = matiere_name
    matiere_name = normalize_matiere_name(matiere_name)
    logger.info(f"Normalized matiere_name: '{original_matiere_name}' -> '{matiere_name}'")

    logger.info(f"Received request for advanced exercise recommendations: student_id={student_id}, matiere_name={matiere_name}, level_id={level_id}")

    try:
        # Obtenir les recommandations avancées
        try:
            # Convertir student_id en user_id pour la fonction de recommandation
            recommendations, scores = get_advanced_exercise_recommendations(student_id, matiere_name, level_id, top_n)

            # Préparer la réponse
            serialized_recommendations = []
            for i, rec in enumerate(recommendations):
                # Récupérer les informations sur l'enseignant
                session = get_db_session()
                try:
                    teacher = session.query(User).filter_by(id=rec.user_id).first()
                    teacher_name = teacher.full_name if teacher else None
                    teacher_avatar = teacher.avatar if teacher else None
                finally:
                    close_db_session(session)

                serialized_recommendations.append({
                    'id': rec.id,
                    'titre': rec.titleAll,  # ✅ Utiliser titleAll au lieu de titre
                    'video': rec.video,  # ✅ Ajout de l'URL de la vidéo
                    'description': rec.description,
                    'page': rec.page,
                    'manuel_id': rec.manuel_id,
                    'thumbnail': rec.thumbnail,
                    'user_id': rec.user_id,
                    'teacher_name': teacher_name,
                    'teacher_avatar': teacher_avatar,
                    'teacher': {
                        'id': rec.user_id,
                        'name': teacher_name or 'مدرس غير معروف',
                        'full_name': teacher_name or 'مدرس غير معروف',
                        'avatar': teacher_avatar or '/default-avatar.jpg',
                        'followers': []
                    },
                    'vues': rec.vues,
                    'likes': rec.likes,
                    'score': round(scores[i], 2) if i < len(scores) else None
                })

            logger.info(f"✅ Successfully retrieved {len(serialized_recommendations)} advanced exercise recommendations")
        except Exception as e:
            logger.error(f"❌ Error calling get_advanced_exercise_recommendations: {str(e)}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")

            # Retourner une liste vide en cas d'erreur
            serialized_recommendations = []

        # Retourner les recommandations
        return jsonify({
            'student_id': student_id,
            'matiere': matiere_name,
            'level_id': level_id,
            'count': len(serialized_recommendations),
            'recommendations': serialized_recommendations
        })
    except Exception as e:
        logger.error(f"Error in recommend_advanced_exercises: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/api/recommendations/courses', methods=['GET'])
def recommend_courses_api():
    """
    Recommander des cours pour un étudiant.

    Paramètres de requête:
    - student_id (int, obligatoire): ID de l'étudiant
    - matiere_name (str, obligatoire): Nom de la matière
    - level_id (int, obligatoire): ID du niveau
    - top_n (int, optionnel): Nombre de recommandations à retourner (défaut: 5)

    Retourne:
    - Liste des cours recommandés
    """
    # Récupérer les paramètres de la requête
    student_id = request.args.get('student_id', type=int)
    matiere_name = request.args.get('matiere_name')
    level_id = request.args.get('level_id', type=int)
    top_n = request.args.get('top_n', default=5, type=int)

    # Vérifier les paramètres obligatoires
    if not student_id:
        return jsonify({
            'error': 'Missing required parameter: student_id',
            'required': ['student_id']
        }), 400

    if not matiere_name:
        return jsonify({
            'error': 'Missing required parameter: matiere_name',
            'required': ['matiere_name']
        }), 400

    # Correction pour les problèmes d'encodage
    if 'Ø±Ù' in matiere_name or 'ø±ù' in matiere_name:
        matiere_name = 'رياضيات'
        logger.info(f"Fixed encoding issue: matiere_name set to 'رياضيات'")
    elif 'ÙØ±' in matiere_name or 'ùø±' in matiere_name:
        matiere_name = 'الفرنسية'
        logger.info(f"Fixed encoding issue: matiere_name set to 'الفرنسية'")
    elif 'Ø¹Ø±' in matiere_name or 'ø¹ø±' in matiere_name:
        matiere_name = 'العربية'
        logger.info(f"Fixed encoding issue: matiere_name set to 'العربية'")
    elif 'Ø¹ÙÙ' in matiere_name or 'ø¹ùù' in matiere_name:
        matiere_name = 'الإيقاظ العلمي'
        logger.info(f"Fixed encoding issue: matiere_name set to 'الإيقاظ العلمي'")

    # Normaliser le nom de la matière
    original_matiere_name = matiere_name
    matiere_name = normalize_matiere_name(matiere_name)
    logger.info(f"Normalized matiere_name: '{original_matiere_name}' -> '{matiere_name}'")

    logger.info(f"Received request for course recommendations: student_id={student_id}, matiere_name={matiere_name}, level_id={level_id}")

    try:
        # Obtenir les recommandations
        try:
            # Appeler la fonction de recommandation de cours
            webinars, scores = recommend_courses(student_id, matiere_name, level_id, top_n)

            # Préparer la réponse
            serialized_recommendations = []
            for i, webinar in enumerate(webinars):
                # Récupérer toutes les informations nécessaires du webinaire
                session = get_db_session()
                try:
                    # Récupérer les traductions
                    webinar_translation = session.query(WebinarTranslation).filter_by(webinar_id=webinar.id).first()
                    webinar_title = webinar_translation.title if webinar_translation else None

                    # Récupérer les informations sur l'enseignant
                    teacher = session.query(User).filter_by(id=webinar.teacher_id).first()
                    teacher_name = teacher.full_name if teacher else None
                    teacher_avatar = teacher.avatar if teacher else None

                    # Récupérer les chapitres et fichiers
                    chapters = session.query(WebinarChapter).filter_by(webinar_id=webinar.id).all()
                    chapters_data = []
                    for chapter in chapters:
                        files = session.query(File).filter_by(chapter_id=chapter.id).all()
                        files_data = []
                        for file in files:
                            file_translations = session.query(FileTranslation).filter_by(file_id=file.id).all()
                            file_data = {
                                'id': file.id,
                                'file': file.file,
                                'file_type': file.file_type,
                                'order': file.order,
                                'translations': [{'title': ft.title, 'description': ft.description, 'locale': ft.locale} for ft in file_translations]
                            }
                            files_data.append(file_data)

                        chapter_data = {
                            'id': chapter.id,
                            'order': chapter.order,
                            'files': files_data
                        }
                        chapters_data.append(chapter_data)

                finally:
                    close_db_session(session)

                serialized_recommendations.append({
                    'id': webinar.id,
                    'title': webinar_title or 'دورة بدون عنوان',
                    'slug': webinar.slug,
                    'image_cover': webinar.image_cover,
                    'thumbnail': webinar.thumbnail or None,
                    'price': webinar.price or 0,
                    'duration': webinar.duration,
                    'type': webinar.type,
                    'status': webinar.status,
                    'description': webinar.description,
                    'teacher': {
                        'id': webinar.teacher_id,
                        'full_name': teacher_name or 'مدرس غير معروف',
                        'avatar': teacher_avatar or '/default-avatar.jpg'
                    },
                    'translations': [{'title': webinar_title}] if webinar_title else [],
                    'chapters': chapters_data,
                    'score': round(scores[i], 2) if i < len(scores) else None,
                    'matched_with_previous_content': scores[i] > 5.0 if i < len(scores) else False,
                    'isAccessible': True,  # Pour les recommandations, on assume qu'elles sont accessibles
                    'isFavorite': False   # À déterminer côté frontend
                })

            logger.info(f"✅ Successfully retrieved {len(serialized_recommendations)} course recommendations")
        except Exception as e:
            logger.error(f"❌ Error calling recommend_courses: {str(e)}")
            logger.error(f"❌ Traceback: {traceback.format_exc()}")

            # Retourner une liste vide en cas d'erreur
            serialized_recommendations = []

        # Retourner les recommandations
        return jsonify({
            'student_id': student_id,
            'matiere': matiere_name,
            'level_id': level_id,
            'count': len(serialized_recommendations),
            'recommendations': serialized_recommendations
        })
    except Exception as e:
        logger.error(f"Error in recommend_courses_api: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    # Récupérer le port depuis les variables d'environnement ou utiliser 8000 par défaut
    port = int(os.environ.get('PORT', 8000))

    # Démarrer l'application
    logger.info(f"Starting recommendation API on port {port}")
    app.run(debug=True, host='0.0.0.0', port=port)
