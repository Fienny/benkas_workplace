from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str  # no length check on login — DB lookup validates credentials


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.user
