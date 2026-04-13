from datetime import datetime

from pydantic import BaseModel, Field


class ProjectFolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class ProjectFolderResponse(BaseModel):
    id: int
    project_id: int
    name: str
    created_by: int
    created_at: datetime

    model_config = {'from_attributes': True}
