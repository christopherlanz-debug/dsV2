from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.user import User
from app.models.screen import Screen
from app.schemas.screen import ScreenCreate, ScreenUpdate, ScreenResponse, ScreenStatus
from app.api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()


@router.get("", response_model=List[ScreenResponse])
async def list_screens(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all screens"""
    screens = db.query(Screen).offset(skip).limit(limit).all()
    return screens


@router.post("", response_model=ScreenResponse, status_code=status.HTTP_201_CREATED)
async def create_screen(
    screen: ScreenCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new screen"""
    # Check if screen name exists
    if db.query(Screen).filter(Screen.name == screen.name).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Screen with this name already exists"
        )
    
    db_screen = Screen(**screen.model_dump())
    db.add(db_screen)
    db.commit()
    db.refresh(db_screen)
    
    return db_screen


@router.get("/{screen_id}", response_model=ScreenResponse)
async def get_screen(
    screen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get screen by ID"""
    screen = db.query(Screen).filter(Screen.id == screen_id).first()
    if not screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found"
        )
    return screen


@router.put("/{screen_id}", response_model=ScreenResponse)
async def update_screen(
    screen_id: int,
    screen_update: ScreenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update screen"""
    db_screen = db.query(Screen).filter(Screen.id == screen_id).first()
    if not db_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found"
        )
    
    # Check if new name conflicts with existing screen
    if screen_update.name and screen_update.name != db_screen.name:
        if db.query(Screen).filter(Screen.name == screen_update.name).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Screen with this name already exists"
            )
    
    update_data = screen_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_screen, field, value)
    
    db.commit()
    db.refresh(db_screen)
    
    return db_screen


@router.delete("/{screen_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_screen(
    screen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete screen"""
    db_screen = db.query(Screen).filter(Screen.id == screen_id).first()
    if not db_screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found"
        )
    
    db.delete(db_screen)
    db.commit()
    
    return None


@router.get("/{screen_id}/status", response_model=ScreenStatus)
async def get_screen_status(
    screen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get screen online status"""
    screen = db.query(Screen).filter(Screen.id == screen_id).first()
    if not screen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Screen not found"
        )
    
    return {
        "screen_id": screen.id,
        "is_online": screen.is_online,
        "last_seen": screen.last_seen,
        "assigned_playlist": screen.assigned_playlist_id
    }
