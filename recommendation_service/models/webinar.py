"""
Webinar model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Text, Enum, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Webinar(Base):
    """Webinar model representing the webinars table."""

    __tablename__ = 'webinars'

    id = Column(Integer, primary_key=True, autoincrement=True)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = Column(Integer, nullable=True)
    type = Column(Enum('webinar', 'course', 'text_lesson'), nullable=False)
    private = Column(Boolean, default=False)
    slug = Column(String(255), nullable=True)
    start_date = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    image_cover = Column(String(255), nullable=True)
    status = Column(Enum('active', 'pending', 'is_draft', 'inactive'), default='pending')
    created_at = Column(Integer, nullable=False)
    updated_at = Column(Integer, nullable=True)
    deleted_at = Column(Integer, nullable=True)
    level_id = Column(Integer, ForeignKey('school_levels.id'), nullable=True)
    matiere_id = Column(Integer, ForeignKey('materials.id'), nullable=True)
    seo_description = Column(String(128), nullable=True)
    thumbnail = Column(String(255), nullable=False)
    video_demo = Column(String(255), nullable=True)
    capacity = Column(Integer, nullable=True)
    price = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    support = Column(Boolean, default=False)
    downloadable = Column(Boolean, default=False)
    partner_instructor = Column(Boolean, default=False)
    subscribe = Column(Boolean, default=False)
    forum = Column(Boolean, default=False)
    access_days = Column(Integer, nullable=True)
    points = Column(Integer, nullable=True)
    message_for_reviewer = Column(Text, nullable=True)
    submaterial_id = Column(Integer, ForeignKey('submaterials.id'), nullable=True)

    # Relationships
    teacher = relationship('User', foreign_keys=[teacher_id], back_populates='webinars')
    chapters = relationship('WebinarChapter', foreign_keys='WebinarChapter.webinar_id', back_populates='webinar')
    translations = relationship('WebinarTranslation', foreign_keys='WebinarTranslation.webinar_id', back_populates='webinar')

    def __repr__(self):
        return f"<Webinar(id={self.id}, slug='{self.slug}', teacher_id={self.teacher_id})>"
