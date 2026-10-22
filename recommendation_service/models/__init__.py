"""
SQLAlchemy models for the recommendation system.
"""

from recommendation_service.common.db_connector import Base

# Import all models
from recommendation_service.models.user import User
from recommendation_service.models.material import Material
from recommendation_service.models.manuel import Manuel
from recommendation_service.models.video import Video
from recommendation_service.models.webinar import Webinar
from recommendation_service.models.webinar_translation import WebinarTranslation
from recommendation_service.models.webinar_chapter import WebinarChapter
from recommendation_service.models.file import File
from recommendation_service.models.file_translation import FileTranslation
from recommendation_service.models.school_level import SchoolLevel
from recommendation_service.models.follow import Follow
from recommendation_service.models.like import Like
from recommendation_service.models.user_view import UserView
from recommendation_service.models.user_min_watched import UserMinWatched
from recommendation_service.models.document import Document
from recommendation_service.models.submaterial import Submaterial
from recommendation_service.models.user_level import UserLevel
from recommendation_service.models.user_matiere import UserMatiere
from recommendation_service.models.child_activity import ChildActivity
from recommendation_service.models.order_item import OrderItem

# Export all models
__all__ = [
    'User',
    'Material',
    'Manuel',
    'Video',
    'Webinar',
    'WebinarTranslation',
    'WebinarChapter',
    'File',
    'FileTranslation',
    'SchoolLevel',
    'Follow',
    'Like',
    'UserView',
    'UserMinWatched',
    'Document',
    'Submaterial',
    'UserLevel',
    'UserMatiere',
    'ChildActivity',
    'OrderItem'
]
