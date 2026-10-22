"""
WebinarTranslation model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class WebinarTranslation(Base):
    """WebinarTranslation model representing the webinar_translations table."""
    
    __tablename__ = 'webinar_translations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    webinar_id = Column(Integer, ForeignKey('webinars.id'), nullable=False)
    locale = Column(String(10), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    seo_description = Column(Text, nullable=True)
    
    # Relationships
    webinar = relationship('Webinar', foreign_keys=[webinar_id], back_populates='translations')
    
    def __repr__(self):
        return f"<WebinarTranslation(id={self.id}, webinar_id={self.webinar_id}, title='{self.title}')>"
