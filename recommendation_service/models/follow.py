"""
Follow model for the recommendation system.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Follow(Base):
    """Follow model representing the follows table."""
    
    __tablename__ = 'follows'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    follower = Column(Integer, ForeignKey('users.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    status = Column(Enum('requested', 'accepted'), default='accepted')
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    
    # Relationships
    teacher = relationship('User', foreign_keys=[user_id], back_populates='followers')
    follower_user = relationship('User', foreign_keys=[follower], back_populates='followings')
    
    def __repr__(self):
        return f"<Follow(id={self.id}, follower={self.follower}, user_id={self.user_id})>"
