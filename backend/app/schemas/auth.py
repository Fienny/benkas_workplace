from pydantic import BaseModel, Field

from app.models.user import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    username: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=4)
    role: UserRole = UserRole.user
