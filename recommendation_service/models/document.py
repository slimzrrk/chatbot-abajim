"""
Document model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class Document(Base):
    """Document model representing the documents table."""
    
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    nombre_page = Column(Integer, nullable=False)
    pdf = Column(String(255), nullable=False)
    manuel_id = Column(Integer, ForeignKey('manuels.id'), nullable=False)
    path_3d_teacher = Column(String(255), name='3d_path_teacher', nullable=True)
    pathenfant = Column(String(255), nullable=True)
    
    # Relationships
    manuel = relationship('Manuel', foreign_keys=[manuel_id], back_populates='documents')
    
    def __repr__(self):
        return f"<Document(id={self.id}, name='{self.name}', manuel_id={self.manuel_id})>"
