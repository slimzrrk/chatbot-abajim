"""
FileTranslation model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class FileTranslation(Base):
    """FileTranslation model representing the file_translations table."""
    
    __tablename__ = 'file_translations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey('files.id'), nullable=False)
    locale = Column(String(10), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Relationships
    file = relationship('File', foreign_keys=[file_id], back_populates='translations')
    
    def __repr__(self):
        return f"<FileTranslation(id={self.id}, file_id={self.file_id}, title='{self.title}')>"
