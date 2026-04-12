from datetime import datetime

from pydantic import BaseModel

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str  # plain str — email field doubles as username, no format enforcement
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {'from_attributes': True}
