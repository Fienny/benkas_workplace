from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class FileResponse(BaseModel):
    id: int
    project_id: int
    folder_id: Optional[int] = None
    uploaded_by: int
    original_name: str
    stored_name: str
    content_type: Optional[str]
    file_size: int
    file_path: str
    created_at: datetime

    model_config = {'from_attributes': True}
