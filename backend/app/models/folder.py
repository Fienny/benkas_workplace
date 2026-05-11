from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProjectFolder(Base):
    __tablename__ = 'project_folders'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    name: Mapped[str] = mapped_column(String(255))
    is_object_folder: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    files = relationship('ProjectFile', back_populates='folder')

    __table_args__ = (
        UniqueConstraint('project_id', 'name', name='uq_project_folders_project_id_name'),
    )
