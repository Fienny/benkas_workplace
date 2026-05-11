from datetime import datetime

from pydantic import BaseModel, Field


class ProjectFolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    is_object_folder: bool = False
    progress: int = Field(default=0, ge=0, le=100)


class ProjectFolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_object_folder: bool | None = None
    progress: int | None = Field(default=None, ge=0, le=100)


class ProjectFolderResponse(BaseModel):
    id: int
    project_id: int
    name: str
    is_object_folder: bool
    progress: int
    created_by: int
    created_at: datetime

    model_config = {'from_attributes': True}
