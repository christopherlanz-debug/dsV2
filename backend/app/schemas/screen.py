from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ScreenBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: Optional[str] = None
    description: Optional[str] = None
    resolution_width: int = 1920
    resolution_height: int = 1080
    orientation: str = "landscape"


class ScreenCreate(ScreenBase):
    pass


class ScreenUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    assigned_playlist_id: Optional[int] = None
    resolution_width: Optional[int] = None
    resolution_height: Optional[int] = None
    orientation: Optional[str] = None


class ScreenResponse(ScreenBase):
    id: int
    is_active: bool
    is_online: bool
    last_seen: Optional[datetime]
    assigned_playlist_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ScreenStatus(BaseModel):
    screen_id: int
    is_online: bool
    last_seen: Optional[datetime]
    assigned_playlist: Optional[str]
