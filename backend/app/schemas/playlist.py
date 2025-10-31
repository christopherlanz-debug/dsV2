from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, time

# INPUT Schema - akzeptiert Strings
class PlaylistScheduleBase(BaseModel):
    start_time: str  # Frontend sendet Strings
    end_time: str
    monday: bool = False
    tuesday: bool = False
    wednesday: bool = False
    thursday: bool = False
    friday: bool = False
    saturday: bool = False
    sunday: bool = False
    is_active: bool = True

    @field_validator('start_time', 'end_time')
    @classmethod
    def validate_time_format(cls, v):
        """Validate time format is HH:MM"""
        if not isinstance(v, str):
            v = str(v)
        if ':' not in v:
            raise ValueError('Time must be in HH:MM format')
        return v

    class Config:
        from_attributes = True


class PlaylistScheduleCreate(PlaylistScheduleBase):
    pass


class PlaylistScheduleUpdate(BaseModel):
    start_time: Optional[str] = None  # ← Ändert von time zu str!
    end_time: Optional[str] = None    # ← Ändert von time zu str!
    monday: Optional[bool] = None
    tuesday: Optional[bool] = None
    wednesday: Optional[bool] = None
    thursday: Optional[bool] = None
    friday: Optional[bool] = None
    saturday: Optional[bool] = None
    sunday: Optional[bool] = None
    is_active: Optional[bool] = None


# OUTPUT Schema - konvertiert time zu Strings
class PlaylistScheduleResponse(BaseModel):
    id: int
    playlist_id: int
    start_time: str  # DB gibt time, aber wir zeigen String
    end_time: str
    monday: bool
    tuesday: bool
    wednesday: bool
    thursday: bool
    friday: bool
    saturday: bool
    sunday: bool
    is_active: bool

    @field_validator('start_time', 'end_time', mode='before')
    @classmethod
    def convert_time_to_string(cls, v):
        """Convert time object to string"""
        if isinstance(v, time):
            return v.isoformat()  # Gibt "HH:MM:SS" zurück
        return v

    class Config:
        from_attributes = True


class PlaylistItemBase(BaseModel):
    content_item_id: int
    order: int = Field(..., ge=0)
    duration_override: Optional[int] = None


class PlaylistItemCreate(PlaylistItemBase):
    pass


class PlaylistItemResponse(PlaylistItemBase):
    id: int
    playlist_id: int
    
    class Config:
        from_attributes = True


class ContentItemPreview(BaseModel):
    id: int
    content_id: int
    item_number: int
    file_path: str
    mime_type: str
    duration: int


class PlaylistItemDetailedResponse(BaseModel):
    id: int
    order: int
    duration: int
    content_item: ContentItemPreview
    
    class Config:
        from_attributes = True


class PlaylistBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    loop: bool = True
    shuffle: bool = False


class PlaylistCreate(PlaylistBase):
    pass


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    loop: Optional[bool] = None
    shuffle: Optional[bool] = None


class PlaylistResponse(PlaylistBase):
    id: int
    is_active: bool
    created_by: int
    created_at: datetime
    items: List[PlaylistItemResponse] = []
    schedules: List[PlaylistScheduleResponse] = []  # ← NEU
    
    class Config:
        from_attributes = True


class PlaylistWithContent(PlaylistResponse):
    items_detailed: List[PlaylistItemDetailedResponse] = []
