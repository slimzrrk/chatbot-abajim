"""
Module de recommandation d'exercices.
Ce module contient les fonctions pour recommander des exercices vidéos aux utilisateurs.
"""

from recommendation_service.exercises.recommender import recommend_exercises, recommend_exercises_advanced
from recommendation_service.exercises.filters import filter_videos_by_subject_and_level, filter_unseen_videos
from recommendation_service.exercises.scoring import calculate_video_score, calculate_similarity_score
from recommendation_service.exercises.cold_start import handle_exercise_cold_start

__all__ = [
    'recommend_exercises',
    'recommend_exercises_advanced',
    'filter_videos_by_subject_and_level',
    'filter_unseen_videos',
    'calculate_video_score',
    'calculate_similarity_score',
    'handle_exercise_cold_start'
]
