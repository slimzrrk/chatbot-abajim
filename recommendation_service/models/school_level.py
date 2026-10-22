"""
SchoolLevel model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class SchoolLevel(Base):
    """SchoolLevel model representing the school_levels table."""

    __tablename__ = 'school_levels'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)

    def __repr__(self):
        return f"<SchoolLevel(id={self.id}, name='{self.name}')>"
