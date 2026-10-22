"""
Database connector for the recommendation system.
"""

import pymysql
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

from .config import DB_CONFIG

# Create SQLAlchemy engine
def create_db_engine():
    """Create a SQLAlchemy engine for database connection."""
    connection_string = (
        f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@"
        f"{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    )
    return create_engine(connection_string, pool_recycle=3600)

# Create base class for SQLAlchemy models
Base = declarative_base()

# Create session factory
engine = create_db_engine()
session_factory = sessionmaker(bind=engine)
Session = scoped_session(session_factory)

def get_db_session():
    """Get a database session."""
    return Session()

def close_db_session(session):
    """Close a database session."""
    session.close()
