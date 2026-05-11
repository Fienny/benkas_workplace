from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ClientProjectAccess(Base):
    __tablename__ = 'client_project_access'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship('User', back_populates='client_project_accesses')
    project = relationship('Project', back_populates='client_accesses')

    __table_args__ = (
        UniqueConstraint('user_id', 'project_id', name='uq_client_project_access_user_id_project_id'),
    )
