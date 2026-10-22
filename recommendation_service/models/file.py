"""
File model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class File(Base):
    """File model representing the files table."""
    
    __tablename__ = 'files'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    webinar_id = Column(Integer, ForeignKey('webinars.id'), nullable=True)
    chapter_id = Column(Integer, ForeignKey('webinar_chapters.id'), nullable=True)
    accessibility = Column(String, nullable=True)
    downloadable = Column(Boolean, default=False)
    storage = Column(String, nullable=True)
    file = Column(String, nullable=False)
    volume = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    interactive_type = Column(String, nullable=True)
    interactive_file_name = Column(String, nullable=True)
    interactive_file_path = Column(String, nullable=True)
    check_previous_parts = Column(Integer, default=0)
    access_after_day = Column(Integer, nullable=True)
    online_viewer = Column(Boolean, default=False)
    order = Column(Integer, nullable=True)
    status = Column(Enum('active', 'inactive'), default='active')
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    chapter = relationship('WebinarChapter', foreign_keys=[chapter_id], back_populates='files')
    translations = relationship('FileTranslation', foreign_keys='FileTranslation.file_id', back_populates='file')
    
    def __repr__(self):
        return f"<File(id={self.id}, file='{self.file}', chapter_id={self.chapter_id})>"
