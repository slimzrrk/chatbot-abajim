"""
UserMinWatched model for the recommendation system.
"""

from sqlalchemy import Column, Integer, Float, BigInteger, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class UserMinWatched(Base):
    """UserMinWatched model representing the user_min_watched table."""
    
    __tablename__ = 'user_min_watched'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    minutes_watched = Column(Float(8, 2), nullable=False, default=0.00)
    latest_watched_day = Column(BigInteger, nullable=True)
    created_at = Column(BigInteger, nullable=True)
    updated_at = Column(BigInteger, nullable=True)
    minutes_watched_day = Column(Float(8, 2), nullable=False, default=0.00)
    
    # Relationships
    user = relationship('User', foreign_keys=[user_id], back_populates='min_watched_stats')
    
    def __repr__(self):
        return f"<UserMinWatched(id={self.id}, user_id={self.user_id}, minutes_watched={self.minutes_watched})>"
