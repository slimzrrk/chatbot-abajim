"""
Manuel model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Manuel(Base):
    """Manuel model representing the manuels table."""

    __tablename__ = 'manuels'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    material_id = Column(Integer, ForeignKey('materials.id'), nullable=False)
    logo = Column(String(64), nullable=True)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)
    opt_id = Column(Integer, nullable=False)

    # Relationships
    material = relationship('Material', foreign_keys=[material_id], back_populates='manuels')
    videos = relationship('Video', foreign_keys='Video.manuel_id', back_populates='manuel')
    documents = relationship('Document', foreign_keys='Document.manuel_id', back_populates='manuel')
    matiere_links = relationship('UserMatiere', foreign_keys='UserMatiere.matiere_id', back_populates='manuel')

    def __repr__(self):
        return f"<Manuel(id={self.id}, name='{self.name}', material_id={self.material_id})>"
