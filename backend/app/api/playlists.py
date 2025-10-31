from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, time

from app.core.database import get_db
from app.models.user import User
from app.models.playlist import Playlist, PlaylistItem, PlaylistSchedule
from app.models.content import ContentItem
from app.schemas.playlist import (
    PlaylistCreate,
    PlaylistUpdate,
    PlaylistResponse,
    PlaylistItemCreate,
    PlaylistItemResponse,
    PlaylistWithContent,
    PlaylistItemDetailedResponse,
    ContentItemPreview,
    PlaylistScheduleCreate,
    PlaylistScheduleUpdate,
    PlaylistScheduleResponse
)
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("", response_model=List[PlaylistResponse])
async def list_playlists(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all playlists"""
    playlists = db.query(Playlist).offset(skip).limit(limit).all()
    return playlists


@router.post("", response_model=PlaylistResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist(
    playlist: PlaylistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new playlist"""
    db_playlist = Playlist(
        **playlist.model_dump(),
        created_by=current_user.id
    )
    
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    
    return db_playlist


@router.get("/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get playlist by ID"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    return playlist


@router.get("/{playlist_id}/full", response_model=PlaylistWithContent)
async def get_playlist_with_content(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get playlist with full content item details and schedules for display"""
    from app.models.playlist import PlaylistSchedule
    
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Get items with content details
    items_detailed = []
    for item in sorted(playlist.items, key=lambda x: x.order):
        content_item = db.query(ContentItem).filter(ContentItem.id == item.content_item_id).first()
        if content_item:
            items_detailed.append({
                "id": item.id,
                "order": item.order,
                "duration": item.duration_override or content_item.duration,
                "content_item": {
                    "id": content_item.id,
                    "content_id": content_item.content_id,
                    "item_number": content_item.item_number,
                    "file_path": content_item.file_path,
                    "mime_type": content_item.mime_type,
                    "duration": content_item.duration
                }
            })
    
    # Get schedules
    schedules = db.query(PlaylistSchedule).filter(PlaylistSchedule.playlist_id == playlist_id).all()
    
    return {
        **playlist.__dict__,
        "items_detailed": items_detailed,
        "schedules": [s.__dict__ for s in schedules]  # ← NEU!
    }

@router.put("/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int,
    playlist_update: PlaylistUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update playlist"""
    db_playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not db_playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    update_data = playlist_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_playlist, field, value)
    
    db.commit()
    db.refresh(db_playlist)
    
    return db_playlist


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete playlist"""
    db_playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not db_playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    db.delete(db_playlist)
    db.commit()
    
    return None


# Playlist Items Management

@router.post("/{playlist_id}/items", response_model=PlaylistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_playlist(
    playlist_id: int,
    item: PlaylistItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add content item to playlist"""
    # Check if playlist exists
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Check if content item exists
    content_item = db.query(ContentItem).filter(ContentItem.id == item.content_item_id).first()
    if not content_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found"
        )
    
    # Create playlist item
    db_item = PlaylistItem(
        playlist_id=playlist_id,
        **item.model_dump()
    )
    
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item


@router.delete("/{playlist_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_playlist(
    playlist_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove item from playlist"""
    db_item = db.query(PlaylistItem).filter(
        PlaylistItem.id == item_id,
        PlaylistItem.playlist_id == playlist_id
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist item not found"
        )
    
    db.delete(db_item)
    db.commit()
    
    return None


@router.put("/{playlist_id}/items/reorder")
async def reorder_playlist_items(
    playlist_id: int,
    item_orders: List[dict],  # [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...]
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reorder playlist items"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Update order for each item
    for item_order in item_orders:
        db_item = db.query(PlaylistItem).filter(
            PlaylistItem.id == item_order["id"],
            PlaylistItem.playlist_id == playlist_id
        ).first()
        
        if db_item:
            db_item.order = item_order["order"]
    
    db.commit()
    
    return {"message": "Playlist items reordered successfully"}

# ===== SCHEDULE MANAGEMENT =====

@router.post("/{playlist_id}/schedules", response_model=PlaylistScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_playlist_schedule(
    playlist_id: int,
    schedule: PlaylistScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a schedule for a playlist"""
    from app.models.playlist import PlaylistSchedule
    from datetime import time as datetime_time
    
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    # Convert strings to time objects
    start_time = datetime_time.fromisoformat(schedule.start_time) if isinstance(schedule.start_time, str) else schedule.start_time
    end_time = datetime_time.fromisoformat(schedule.end_time) if isinstance(schedule.end_time, str) else schedule.end_time
    
    # Check for time overlap - ABER NUR FÜR ÜBERLAPPENDE TAGE!
    overlapping = db.query(PlaylistSchedule).filter(
        PlaylistSchedule.playlist_id == playlist_id,
        PlaylistSchedule.start_time < end_time,
        PlaylistSchedule.end_time > start_time,
        PlaylistSchedule.is_active == True
    ).all()
    
    # Prüfe ob die überlappenden Zeiten auch an den gleichen Tagen sind
    for overlap in overlapping:
        # Prüfe ob mindestens ein gemeinsamer Tag existiert
        common_days = False
        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            if getattr(schedule, day) and getattr(overlap, day):
                common_days = True
                break
        
        if common_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Schedule overlaps with existing schedule on same days and times"
            )
    
    db_schedule = PlaylistSchedule(
        playlist_id=playlist_id,
        start_time=start_time,
        end_time=end_time,
        monday=schedule.monday,
        tuesday=schedule.tuesday,
        wednesday=schedule.wednesday,
        thursday=schedule.thursday,
        friday=schedule.friday,
        saturday=schedule.saturday,
        sunday=schedule.sunday,
        is_active=schedule.is_active
    )
    
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule


@router.get("/{playlist_id}/schedules", response_model=List[PlaylistScheduleResponse])
async def get_playlist_schedules(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all schedules for a playlist"""
    from app.models.playlist import PlaylistSchedule
    
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    schedules = db.query(PlaylistSchedule).filter(PlaylistSchedule.playlist_id == playlist_id).all()
    return schedules


@router.put("/{playlist_id}/schedules/{schedule_id}", response_model=PlaylistScheduleResponse)
async def update_playlist_schedule(
    playlist_id: int,
    schedule_id: int,
    schedule_update: PlaylistScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a playlist schedule"""
    from app.models.playlist import PlaylistSchedule
    
    db_schedule = db.query(PlaylistSchedule).filter(
        PlaylistSchedule.id == schedule_id,
        PlaylistSchedule.playlist_id == playlist_id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    update_data = schedule_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule


@router.delete("/{playlist_id}/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist_schedule(
    playlist_id: int,
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete a playlist schedule"""
    from app.models.playlist import PlaylistSchedule
    
    db_schedule = db.query(PlaylistSchedule).filter(
        PlaylistSchedule.id == schedule_id,
        PlaylistSchedule.playlist_id == playlist_id
    ).first()
    
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    db.delete(db_schedule)
    db.commit()
    
    return None


# ===== UTILITY ENDPOINTS =====

@router.get("/{playlist_id}/active-schedule")
async def get_active_schedule_for_playlist(
    playlist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get the currently active schedule for a playlist (if any)"""
    from app.models.playlist import PlaylistSchedule
    from datetime import datetime, time
    
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playlist not found"
        )
    
    # Get all active schedules
    schedules = db.query(PlaylistSchedule).filter(
        PlaylistSchedule.playlist_id == playlist_id,
        PlaylistSchedule.is_active == True
    ).all()
    
    # Check which one is currently active
    now = datetime.now()
    current_weekday = now.weekday()  # 0=Monday, 6=Sunday
    current_time = now.time()
    
    day_map = {
        0: 'monday',
        1: 'tuesday',
        2: 'wednesday',
        3: 'thursday',
        4: 'friday',
        5: 'saturday',
        6: 'sunday'
    }
    
    day_name = day_map[current_weekday]
    
    for schedule in schedules:
        day_enabled = getattr(schedule, day_name)
        if day_enabled and schedule.start_time <= current_time <= schedule.end_time:
            return {
                "schedule": schedule,
                "is_active": True,
                "current_time": current_time.isoformat()
            }
    
    return {
        "schedule": None,
        "is_active": False,
        "current_time": current_time.isoformat()
    }
