"""
Material model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Material(Base):
    """Material model representing the materials table."""
    
    __tablename__ = 'materials'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    section_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    manuels = relationship('Manuel', foreign_keys='Manuel.material_id', back_populates='material')
    submaterials = relationship('Submaterial', foreign_keys='Submaterial.material_id', back_populates='material')
    
    def __repr__(self):
        return f"<Material(id={self.id}, name='{self.name}')>"
