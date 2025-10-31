from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, screens, content, playlists, websocket, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    print(f"✓ Upload directory ready: {settings.UPLOAD_DIR}")
    
    # Create tables if they don't exist (for development only)
    # In production, use Alembic migrations
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables ready")
    
    yield
    
    # Shutdown
    print("✓ Application shutdown")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - WICHTIG: WebSocket OHNE prefix!
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["Users"]) 
app.include_router(screens.router, prefix=f"{settings.API_PREFIX}/screens", tags=["Screens"])
app.include_router(content.router, prefix=f"{settings.API_PREFIX}/content", tags=["Content"])
app.include_router(playlists.router, prefix=f"{settings.API_PREFIX}/playlists", tags=["Playlists"])
app.include_router(websocket.router, tags=["WebSocket"])  # ← KEIN PREFIX!


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "storage": os.path.exists(settings.UPLOAD_DIR)
    }
