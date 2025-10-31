from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.content import ContentType


class ContentItemResponse(BaseModel):
    id: int
    content_id: int
    item_number: int
    file_path: str
    mime_type: str
    duration: int
    
    class Config:
        from_attributes = True


class ContentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    duration: int = Field(default=10, ge=1)  # At least 1 second


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None


class ContentResponse(ContentBase):
    id: int
    file_path: str
    file_name: str
    file_size: int
    content_type: ContentType
    mime_type: str
    thumbnail_path: Optional[str]
    pdf_page_count: Optional[int]
    created_by: int
    created_at: datetime
    items: List[ContentItemResponse] = []  # PDF-Seiten oder Video-Segmente
    
    class Config:
        from_attributes = True


class ContentUploadResponse(BaseModel):
    id: int
    title: str
    file_name: str
    content_type: ContentType
    pdf_page_count: Optional[int]
    items_count: int
    message: str
