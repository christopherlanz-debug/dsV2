from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    """User Roles"""
    ADMIN = "admin"          # Vollständiger Zugriff
    EDITOR = "editor"        # Content + Playlists, keine Screens/Users
    VIEWER = "viewer"        # Nur Lesen, Statistiken


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    
    # Rollen & Permissions
    role = Column(SQLEnum(UserRole), default=UserRole.VIEWER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Legacy field, nutze role statt dessen
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
