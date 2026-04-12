from datetime import datetime

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    project_id: int
    uploaded_by: int
    original_name: str
    stored_name: str
    content_type: str | None
    file_size: int
    file_path: str
    created_at: datetime

    model_config = {'from_attributes': True}
