"""
UserLevel model for the recommendation system.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class UserLevel(Base):
    """UserLevel model representing the user_level table."""
    
    __tablename__ = 'user_level'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    level_id = Column(Integer, ForeignKey('school_levels.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    teacher = relationship('User', foreign_keys=[teacher_id], back_populates='levels')
    
    def __repr__(self):
        return f"<UserLevel(id={self.id}, teacher_id={self.teacher_id}, level_id={self.level_id})>"
