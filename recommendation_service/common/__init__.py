"""
Common utilities for the recommendation system.
"""

from recommendation_service.common.config import DB_CONFIG, TEACHER_ROLE_ID, STUDENT_ROLE_ID, ACTIVE_STATUS, APPROVED_STATUS, DEFAULT_TOP_N, MIN_SIMILARITY_SCORE, WEIGHTS, INTERACTION_SCORES, MANUAL_LEVEL_MAPPING
from recommendation_service.common.db_connector import Base, get_db_session, close_db_session

__all__ = [
    'DB_CONFIG',
    'TEACHER_ROLE_ID',
    'STUDENT_ROLE_ID',
    'ACTIVE_STATUS',
    'APPROVED_STATUS',
    'DEFAULT_TOP_N',
    'MIN_SIMILARITY_SCORE',
    'WEIGHTS',
    'INTERACTION_SCORES',
    'MANUAL_LEVEL_MAPPING',
    'Base',
    'get_db_session',
    'close_db_session'
]
