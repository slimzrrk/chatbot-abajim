"""
Like model for the recommendation system.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Like(Base):
    """Like model representing the likes table."""
    
    __tablename__ = 'likes'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    video_id = Column(Integer, ForeignKey('videos.id'), nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship('User', foreign_keys=[user_id], back_populates='likes')
    video = relationship('Video', foreign_keys=[video_id], back_populates='video_likes')
    
    def __repr__(self):
        return f"<Like(id={self.id}, user_id={self.user_id}, video_id={self.video_id})>"
