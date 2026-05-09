from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    action: str
    entity_label: str
    context_label: Optional[str]
    created_at: datetime

    model_config = {'from_attributes': True}
