from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.user import User, UserRole


async def get_current_active_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get currently authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure user is admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_editor_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure user is admin or editor"""
    if current_user.role not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor access required"
        )
    return current_user
