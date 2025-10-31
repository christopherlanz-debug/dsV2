from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio


class ConnectionManager:
    """Manages WebSocket connections for displays"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, screen_id: str):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[screen_id] = websocket
        
        # Start heartbeat
        task = asyncio.create_task(self._heartbeat(screen_id))
        self.heartbeat_tasks[screen_id] = task
        
        print(f"Screen {screen_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, screen_id: str):
        """Remove a WebSocket connection"""
        if screen_id in self.active_connections:
            del self.active_connections[screen_id]
        
        # Cancel heartbeat
        if screen_id in self.heartbeat_tasks:
            self.heartbeat_tasks[screen_id].cancel()
            del self.heartbeat_tasks[screen_id]
        
        print(f"Screen {screen_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, screen_id: str):
        """Send message to a specific screen"""
        if screen_id in self.active_connections:
            try:
                await self.active_connections[screen_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {screen_id}: {e}")
                self.disconnect(screen_id)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected screens"""
        disconnected = []
        
        for screen_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to {screen_id}: {e}")
                disconnected.append(screen_id)
        
        # Clean up disconnected clients
        for screen_id in disconnected:
            self.disconnect(screen_id)
    
    async def _heartbeat(self, screen_id: str):
        """Send periodic heartbeat to keep connection alive"""
        while screen_id in self.active_connections:
            try:
                await self.send_personal_message({"type": "ping"}, screen_id)
                await asyncio.sleep(30)  # Ping every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Heartbeat error for {screen_id}: {e}")
                break
    
    def get_connected_screens(self) -> List[str]:
        """Get list of all connected screen IDs"""
        return list(self.active_connections.keys())


# Global instance
manager = ConnectionManager()
