from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token, LoginRequest

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint"""
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/setup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def setup_admin(
    setup_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Setup initial admin user"""
    # Check if already setup
    admin_exists = db.query(User).filter(User.is_admin == True).first()
    if admin_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System already configured"
        )
    
    # Create admin user with ADMIN role
    db_user = User(
        username=setup_data.username,
        email=setup_data.email,
        full_name=setup_data.full_name,
        hashed_password=get_password_hash(setup_data.password),
        role=UserRole.ADMIN,  # ← WICHTIG: Admin Role!
        is_admin=True,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/setup/status")
async def setup_status(db: Session = Depends(get_db)):
    """Check if initial setup is required"""
    user_count = db.query(User).count()
    return {
        "setup_required": user_count == 0,
        "user_count": user_count
    }

