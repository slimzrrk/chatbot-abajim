"""
Video model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Text, Enum, Float, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Video(Base):
    """Video model representing the videos table."""
    
    __tablename__ = 'videos'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    titre = Column(String(200), nullable=False)
    video = Column(Text, nullable=False)
    page = Column(Integer, nullable=True)
    description = Column(String(200), nullable=True)
    numero = Column(Integer, nullable=True)
    manuel_id = Column(Integer, ForeignKey('manuels.id'))
    thumbnail = Column(String(255), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    vues = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    titleAll = Column(String(255), nullable=True)
    status = Column(Enum('PENDING', 'APPROVED', 'REJECTED'), default='PENDING')
    total_minutes_watched = Column(Float(8, 2), default=0.00)
    
    # Relationships
    teacher = relationship('User', foreign_keys=[user_id], back_populates='videos')
    manuel = relationship('Manuel', foreign_keys=[manuel_id], back_populates='videos')
    video_likes = relationship('Like', foreign_keys='Like.video_id', back_populates='video')
    user_views = relationship('UserView', foreign_keys='UserView.video_id', back_populates='video')
    
    def __repr__(self):
        return f"<Video(id={self.id}, titre='{self.titre}', user_id={self.user_id})>"
