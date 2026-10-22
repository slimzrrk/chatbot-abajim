"""
Submaterial model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Submaterial(Base):
    """Submaterial model representing the submaterials table."""
    
    __tablename__ = 'submaterials'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    
    # Relationships
    material = relationship('Material', foreign_keys=[material_id], back_populates='submaterials')
    
    def __repr__(self):
        return f"<Submaterial(id={self.id}, name='{self.name}', material_id={self.material_id})>"
