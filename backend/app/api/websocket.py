from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import json

from app.core.database import get_db
from app.core.websocket_manager import manager
from app.models.screen import Screen
from app.models.playlist import Playlist, PlaylistItem
from app.models.content import ContentItem

router = APIRouter(prefix="/ws")


@router.websocket("/screen/{screen_name}")
async def screen_websocket(
    websocket: WebSocket,
    screen_name: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for display screens"""
    
    # Find or create screen
    screen = db.query(Screen).filter(Screen.name == screen_name).first()
    if not screen:
        # Auto-register screen
        screen = Screen(
            name=screen_name,
            location="Auto-registered",
            is_active=True,
            is_online=True,
            last_seen=datetime.utcnow()
        )
        db.add(screen)
        db.commit()
        db.refresh(screen)
    else:
        # Update screen status
        screen.is_online = True
        screen.last_seen = datetime.utcnow()
        db.commit()
    
    # Connect WebSocket
    await manager.connect(websocket, screen_name)
    
    try:
        # Send initial playlist if assigned
        if screen.assigned_playlist_id:
            playlist_data = await get_playlist_data(screen.assigned_playlist_id, db)
            if playlist_data:
                await manager.send_personal_message(
                    {
                        "type": "playlist_update",
                        "playlist": playlist_data
                    },
                    screen_name
                )
        
        # Listen for messages from display
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "pong":
                # Heartbeat response
                screen.last_seen = datetime.utcnow()
                db.commit()
            
            elif message.get("type") == "status_update":
                # Display status update (currently playing, etc.)
                print(f"Status update from {screen_name}: {message.get('status')}")
            
            elif message.get("type") == "error":
                # Display reported an error
                print(f"Error from {screen_name}: {message.get('error')}")
    
    except WebSocketDisconnect:
        manager.disconnect(screen_name)
        
        # Update screen status
        screen.is_online = False
        screen.last_seen = datetime.utcnow()
        db.commit()
        
        print(f"Screen {screen_name} disconnected")
    
    except Exception as e:
        print(f"WebSocket error for {screen_name}: {e}")
        manager.disconnect(screen_name)
        
        screen.is_online = False
        db.commit()


async def get_playlist_data(playlist_id: int, db: Session) -> dict:
    """Get playlist data with all content item details"""
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        return None
    
    items = []
    try:
        for item in sorted(playlist.items, key=lambda x: x.order):
            # Get the ContentItem using content_item_id
            content_item = db.query(ContentItem).filter(ContentItem.id == item.content_item_id).first()
            if content_item:
                items.append({
                    "id": item.id,
                    "order": item.order,
                    "duration": item.duration_override or content_item.duration,
                    "content": {
                        "id": content_item.id,
                        "content_id": content_item.content_id,
                        "item_number": content_item.item_number,
                        "file_path": content_item.file_path,
                        "content_type": "image",
                        "mime_type": content_item.mime_type
                    }
                })
    except Exception as e:
        print(f"Error building playlist data: {e}")
        return None
    
    return {
        "id": playlist.id,
        "name": playlist.name,
        "loop": playlist.loop,
        "shuffle": playlist.shuffle,
        "items": items
    }


@router.post("/broadcast")
async def broadcast_message(message: dict):
    """Broadcast message to all connected screens (admin use)"""
    await manager.broadcast(message)
    return {"message": "Broadcast sent", "recipients": len(manager.active_connections)}


@router.post("/screen/{screen_name}/reload")
async def reload_screen(
    screen_name: str,
    db: Session = Depends(get_db)
):
    """Send reload command to specific screen"""
    screen = db.query(Screen).filter(Screen.name == screen_name).first()
    if not screen:
        return {"error": "Screen not found"}, 404
    
    # Get current playlist
    if screen.assigned_playlist_id:
        playlist_data = await get_playlist_data(screen.assigned_playlist_id, db)
        if playlist_data:
            await manager.send_personal_message(
                {
                    "type": "playlist_update",
                    "playlist": playlist_data
                },
                screen_name
            )
        return {"message": f"Reload command sent to {screen_name}"}
    else:
        return {"message": "No playlist assigned to screen"}


@router.get("/connected")
async def get_connected_screens():
    """Get list of currently connected screens"""
    connected = manager.get_connected_screens()
