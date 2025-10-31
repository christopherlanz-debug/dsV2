from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum as PyEnum


class UserRole(str, PyEnum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, max_length=72)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_admin: bool
    created_at: Optional[datetime] = None  # ← Nullable!
    last_login: Optional[datetime] = None
        
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    hashed_password: str
