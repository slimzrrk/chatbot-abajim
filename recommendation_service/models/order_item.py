"""
OrderItem model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..common.db_connector import Base

class OrderItem(Base):
    """OrderItem model representing the order_items table."""

    __tablename__ = 'order_items'

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    order_id = Column(Integer, nullable=False)
    model_type = Column(String(255), nullable=False)
    model_id = Column(Integer, nullable=False)
    # Suppression des colonnes qui n'existent pas dans la base de données
    amount = Column(Float, default=0)
    total_amount = Column(Float, default=0)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship('User', foreign_keys=[user_id])

    def __repr__(self):
        return f"<OrderItem(id={self.id}, user_id={self.user_id}, model_type='{self.model_type}', model_id={self.model_id})>"
