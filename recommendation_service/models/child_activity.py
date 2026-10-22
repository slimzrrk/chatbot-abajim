"""
ChildActivity model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..common.db_connector import Base

class ChildActivity(Base):
    """ChildActivity model representing the child_activities table."""

    __tablename__ = 'child_activities'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    child_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    action_type = Column(Enum('navigation', 'book', 'webinar', 'meeting', 'video'), nullable=False)
    screen_name = Column(String(255), nullable=True)
    reference_id = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    child = relationship('User', foreign_keys=[child_id])

    def __repr__(self):
        return f"<ChildActivity(id={self.id}, child_id={self.child_id}, action_type='{self.action_type}', reference_id={self.reference_id})>"
