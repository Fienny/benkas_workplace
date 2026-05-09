from datetime import date, datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    code: str = Field(min_length=3, max_length=50)
    title: str = Field(min_length=3, max_length=255)
    type: str = Field(min_length=2, max_length=120)
    region: str = Field(min_length=2, max_length=50)
    status: str = Field(default='active', max_length=50)
    progress: int = Field(default=0, ge=0, le=100)
    description: str | None = None
    due_date: date | None = None
    responsible_id: int | None = None
    # owner_id is auto-assigned from the authenticated user on create


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    code: str | None = Field(default=None, min_length=3, max_length=50)
    type: str | None = Field(default=None, min_length=2, max_length=120)
    region: str | None = Field(default=None, min_length=2, max_length=50)
    status: str | None = Field(default=None, max_length=50)
    progress: int | None = Field(default=None, ge=0, le=100)
    description: str | None = None
    due_date: date | None = None
    responsible_id: int | None = None


class ProjectResponse(BaseModel):
    id: int
    code: str
    title: str
    type: str
    region: str
    status: str
    progress: int
    description: str | None
    due_date: date | None
    owner_id: int
    responsible_id: int | None = None
    responsible_name: str | None = None
    created_at: datetime
    file_count: int = 0

    model_config = {'from_attributes': True}
