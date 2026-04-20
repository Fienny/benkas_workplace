from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {'from_attributes': True}


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    username: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=4)
    role: UserRole = UserRole.user


class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    username: Optional[str] = Field(None, min_length=2, max_length=100)
    password: Optional[str] = Field(None, min_length=4)
