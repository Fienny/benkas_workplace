from datetime import datetime

from sqlalchemy import DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column()          # keep even if user later deleted
    user_name: Mapped[str] = mapped_column(String(255))   # denormalised full name
    action: Mapped[str] = mapped_column(String(50))       # e.g. 'file.upload'
    entity_label: Mapped[str] = mapped_column(String(255))          # filename / project code / username
    context_label: Mapped[str | None] = mapped_column(String(255), nullable=True)  # project code when action is on a file
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    __table_args__ = (
        Index('ix_audit_logs_created_at', 'created_at'),
    )
