"""
UserMatiere model for the recommendation system.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class UserMatiere(Base):
    """UserMatiere model representing the user_matiere table."""
    
    __tablename__ = 'user_matiere'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    matiere_id = Column(Integer, ForeignKey('manuels.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    level_id = Column(Integer, ForeignKey('school_levels.id'), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    teacher = relationship('User', foreign_keys=[teacher_id], back_populates='matieres')
    manuel = relationship('Manuel', foreign_keys=[matiere_id], back_populates='matiere_links')
    
    def __repr__(self):
        return f"<UserMatiere(id={self.id}, teacher_id={self.teacher_id}, matiere_id={self.matiere_id})>"
