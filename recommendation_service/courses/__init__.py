"""
Module de recommandation de cours.
Ce module contient les fonctions pour recommander des cours (webinaires) aux utilisateurs.
"""

from recommendation_service.courses.recommender import recommend_courses
from recommendation_service.courses.filters import filter_webinars_by_subject_and_level, filter_unseen_webinars
from recommendation_service.courses.scoring import calculate_webinar_score, calculate_similarity_score
from recommendation_service.courses.cold_start import handle_course_cold_start

__all__ = [
    'recommend_courses',
    'filter_webinars_by_subject_and_level',
    'filter_unseen_webinars',
    'calculate_webinar_score',
    'calculate_similarity_score',
    'handle_course_cold_start'
]
