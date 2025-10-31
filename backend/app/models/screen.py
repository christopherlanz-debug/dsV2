from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Screen(Base):
    __tablename__ = "screens"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    location = Column(String(255))
    
    # Status
    is_active = Column(Boolean, default=True)
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    # Playlist Assignment
    assigned_playlist_id = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

