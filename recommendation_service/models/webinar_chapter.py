"""
WebinarChapter model for the recommendation system.
"""

from sqlalchemy import Column, Integer, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class WebinarChapter(Base):
    """WebinarChapter model representing the webinar_chapters table."""
    
    __tablename__ = 'webinar_chapters'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    webinar_id = Column(Integer, ForeignKey('webinars.id'), nullable=False)
    order = Column(Integer, nullable=True)
    check_all_contents_pass = Column(Boolean, default=False)
    status = Column(Enum('active', 'inactive'), default='active')
    created_at = Column(Integer, nullable=False)
    
    # Relationships
    webinar = relationship('Webinar', foreign_keys=[webinar_id], back_populates='chapters')
    files = relationship('File', foreign_keys='File.chapter_id', back_populates='chapter')
    
    def __repr__(self):
        return f"<WebinarChapter(id={self.id}, webinar_id={self.webinar_id})>"
