from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    loop = Column(Boolean, default=True)
    shuffle = Column(Boolean, default=False)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    items = relationship("PlaylistItem", back_populates="playlist", cascade="all, delete-orphan")
    schedules = relationship("PlaylistSchedule", back_populates="playlist", cascade="all, delete-orphan")


class PlaylistItem(Base):
    __tablename__ = "playlist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    content_item_id = Column(Integer, ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    duration_override = Column(Integer, nullable=True)
    
    playlist = relationship("Playlist", back_populates="items")


class PlaylistSchedule(Base):
    """Zeitplan für Playlist - wann soll diese Playlist angezeigt werden"""
    __tablename__ = "playlist_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    
    # Zeitfenster
    start_time = Column(Time, nullable=False)  # z.B. 09:00:00
    end_time = Column(Time, nullable=False)    # z.B. 17:00:00
    
    # Wochentage (0=Montag, 6=Sonntag)
    monday = Column(Boolean, default=False)
    tuesday = Column(Boolean, default=False)
    wednesday = Column(Boolean, default=False)
    thursday = Column(Boolean, default=False)
    friday = Column(Boolean, default=False)
    saturday = Column(Boolean, default=False)
    sunday = Column(Boolean, default=False)
    
    is_active = Column(Boolean, default=True)
    
    playlist = relationship("Playlist", back_populates="schedules")
