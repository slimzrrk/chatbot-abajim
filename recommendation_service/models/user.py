"""
User model for the recommendation system.
"""

from sqlalchemy import Column, Integer, String, Enum, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from ..common.db_connector import Base

class User(Base):
    """User model representing the users table."""

    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(128), nullable=False)
    role_name = Column(String(64))
    role_id = Column(Integer)
    organ_id = Column(Integer, nullable=True)
    sexe = Column(Enum('Garçon', 'Fille'), nullable=True)
    mobile = Column(String(32))
    email = Column(String(255), unique=True)
    bio = Column(Text)
    password = Column(String(255))
    facebook_id = Column(String(255))
    google_id = Column(String(255))
    remember_token = Column(String(255))
    verified = Column(Boolean, default=False)
    financial_approval = Column(Boolean, default=False)
    avatar = Column(String(255))
    avatar_settings = Column(String(255))
    cover_img = Column(String(255))
    about = Column(Text)
    address = Column(String(255))
    country_id = Column(Integer)
    province_id = Column(Integer)
    city_id = Column(Integer)
    district_id = Column(Integer)
    location = Column(String(255))
    level_of_training = Column(Enum('1', '2', '3'))
    meeting_type = Column(Enum('all', 'in_person', 'online'))
    status = Column(Enum('active', 'pending', 'inactive'), default='pending')
    access_content = Column(String(255))
    language = Column(String(255))
    newsletter = Column(Boolean, default=False)
    public_message = Column(Boolean, default=False)
    account_type = Column(String(128))
    ban = Column(String(128))
    account_id = Column(String(128))
    certificate = Column(String(128))
    commission = Column(String(128))
    affiliate = Column(Boolean, default=False)
    can_create_store = Column(Boolean, default=False)
    ban_start_at = Column(DateTime)
    ban_end_at = Column(DateTime)
    offline_message = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
    school_id = Column(Integer)
    section_id = Column(Integer)
    level_id = Column(Integer)
    otp = Column(String(6), nullable=True)
    otpExpires = Column(DateTime, nullable=True)

    # Relationships
    webinars = relationship('Webinar', foreign_keys='Webinar.teacher_id', back_populates='teacher')
    videos = relationship('Video', foreign_keys='Video.user_id', back_populates='teacher')
    followers = relationship('Follow', foreign_keys='Follow.user_id', back_populates='teacher')
    followings = relationship('Follow', foreign_keys='Follow.follower', back_populates='follower_user')
    likes = relationship('Like', foreign_keys='Like.user_id', back_populates='user')
    video_views = relationship('UserView', foreign_keys='UserView.user_id', back_populates='user')
    min_watched_stats = relationship('UserMinWatched', foreign_keys='UserMinWatched.user_id', back_populates='user')
    matieres = relationship('UserMatiere', foreign_keys='UserMatiere.teacher_id', back_populates='teacher')
    levels = relationship('UserLevel', foreign_keys='UserLevel.teacher_id', back_populates='teacher')
    activities = relationship('ChildActivity', foreign_keys='ChildActivity.child_id', back_populates='child')

    def __repr__(self):
        return f"<User(id={self.id}, full_name='{self.full_name}', role_id={self.role_id})>"
