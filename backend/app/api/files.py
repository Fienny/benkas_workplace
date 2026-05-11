from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_access, require_project_write_access
from app.db.session import get_db
from app.models.file import ProjectFile
from app.models.folder import ProjectFolder
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.file import FileResponse as FileSchema
from app.services.audit import log_action
from app.services.storage import StorageService

router = APIRouter(prefix='/files', tags=['files'])
storage_service = StorageService()


@router.get('/project/{project_id}', response_model=list[FileSchema])
def list_project_files(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_access(current_user, project)

    return list(
        db.scalars(
            select(ProjectFile)
            .where(ProjectFile.project_id == project_id)
            .order_by(ProjectFile.created_at.desc())
        ).all()
    )


@router.post('/project/{project_id}', response_model=FileSchema, status_code=status.HTTP_201_CREATED)
def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    folder_id: int | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_write_access(current_user, project)

    if folder_id is not None:
        folder = db.get(ProjectFolder, folder_id)
        if not folder or folder.project_id != project_id:
            raise HTTPException(status_code=400, detail='Folder does not belong to this project')

    stored_name, file_path, file_size = storage_service.save(file)
    record = ProjectFile(
        project_id=project_id,
        folder_id=folder_id,
        uploaded_by=current_user.id,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        content_type=file.content_type,
        file_size=file_size,
        file_path=file_path,
    )
    db.add(record)
    log_action(db, current_user, 'file.upload', file.filename or stored_name, context_label=project.code)
    db.commit()
    db.refresh(record)
    return record


@router.get('/{file_id}/download')
def download_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.get(ProjectFile, file_id)
    if not record:
        raise HTTPException(status_code=404, detail='File not found')
    project = db.get(Project, record.project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_access(current_user, project)

    url = storage_service.presigned_url(record.file_path, record.original_name)
    if url:
        return RedirectResponse(url)

    # Local filesystem fallback
    if not Path(record.file_path).exists():
        raise HTTPException(status_code=404, detail='File not found')
    return FileResponse(record.file_path, media_type=record.content_type, filename=record.original_name)


@router.delete('/{file_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.get(ProjectFile, file_id)
    if not record:
        raise HTTPException(status_code=404, detail='File not found')

    project = db.get(Project, record.project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_write_access(current_user, project)
    is_project_lead = project.responsible_id == current_user.id

    if (
        current_user.role != UserRole.admin
        and record.uploaded_by != current_user.id
        and not is_project_lead
    ):
        raise HTTPException(status_code=403, detail='You can only delete files you uploaded')

    original_name = record.original_name
    storage_service.delete(record.file_path)
    db.delete(record)
    log_action(db, current_user, 'file.delete', original_name, context_label=project.code if project else None)
    db.commit()
