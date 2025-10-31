from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class ContentType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    PDF = "pdf"


class Content(Base):
    __tablename__ = "content"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # in bytes
    content_type = Column(SQLEnum(ContentType), nullable=False)
    mime_type = Column(String(100))
    duration = Column(Integer, default=10)  # Display duration in seconds
    thumbnail_path = Column(String(500))
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # PDF-spezifische Felder
    pdf_page_count = Column(Integer, nullable=True)  # Anzahl Seiten bei PDF
    
    # Beziehung zu ContentItems
    items = relationship("ContentItem", back_populates="content", cascade="all, delete-orphan")


class ContentItem(Base):
    """Einzelne Items aus Content (z.B. PDF-Seite, Bild, Video-Segment)"""
    __tablename__ = "content_items"
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("content.id", ondelete="CASCADE"), nullable=False)
    item_number = Column(Integer, nullable=False)  # Seite 1, 2, 3... oder Segment-Nummer
    file_path = Column(String(500), nullable=False)  # z.B. /storage/uploads/pdf_123_page_1.jpg
    mime_type = Column(String(100))  # image/jpeg
    duration = Column(Integer, default=10)  # Display duration in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Beziehung zum übergeordneten Content
    content = relationship("Content", back_populates="items")
