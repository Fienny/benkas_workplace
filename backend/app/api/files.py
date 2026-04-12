from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.file import ProjectFile
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.file import FileResponse as FileSchema
from app.services.storage import StorageService

router = APIRouter(prefix='/files', tags=['files'])
storage_service = StorageService()


@router.get('/project/{project_id}', response_model=list[FileSchema])
def list_project_files(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = current_user
    return list(
        db.scalars(select(ProjectFile).where(ProjectFile.project_id == project_id).order_by(ProjectFile.created_at.desc())).all()
    )


@router.post('/project/{project_id}', response_model=FileSchema, status_code=status.HTTP_201_CREATED)
def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')

    stored_name, file_path, file_size = storage_service.save(file)
    record = ProjectFile(
        project_id=project_id,
        uploaded_by=current_user.id,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        content_type=file.content_type,
        file_size=file_size,
        file_path=file_path,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get('/{file_id}/download')
def download_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = current_user
    record = db.get(ProjectFile, file_id)
    if not record or not Path(record.file_path).exists():
        raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(record.file_path, media_type=record.content_type, filename=record.original_name)


@router.delete('/{file_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.get(ProjectFile, file_id)
    if not record:
        raise HTTPException(status_code=404, detail='File not found')
    if current_user.role != UserRole.admin and record.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail='Not enough permissions')
    storage_service.delete(record.file_path)
    db.delete(record)
    db.commit()
