from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ProjectFile(Base):
    __tablename__ = 'project_files'

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey('projects.id', ondelete='CASCADE'), index=True)
    folder_id: Mapped[int | None] = mapped_column(ForeignKey('project_folders.id', ondelete='SET NULL'), nullable=True, index=True)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    original_name: Mapped[str] = mapped_column(String(255))
    stored_name: Mapped[str] = mapped_column(String(255), unique=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer)
    file_path: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    project = relationship('Project', back_populates='files')
    folder = relationship('ProjectFolder', back_populates='files')
    uploaded_by_user = relationship('User', back_populates='uploaded_files')
