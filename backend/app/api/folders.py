from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_project_access, require_project_write_access
from app.db.session import get_db
from app.models.file import ProjectFile
from app.models.folder import ProjectFolder
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.folder import ProjectFolderCreate, ProjectFolderResponse

router = APIRouter(prefix='/projects', tags=['folders'])


@router.get('/{project_id}/folders', response_model=list[ProjectFolderResponse])
def list_folders(
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
            select(ProjectFolder)
            .where(ProjectFolder.project_id == project_id)
            .order_by(ProjectFolder.name)
        ).all()
    )


@router.post('/{project_id}/folders', response_model=ProjectFolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(
    project_id: int,
    payload: ProjectFolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_write_access(current_user, project)
    if db.scalar(select(ProjectFolder).where(
        ProjectFolder.project_id == project_id,
        ProjectFolder.name == payload.name,
    )):
        raise HTTPException(status_code=400, detail='A folder with this name already exists')

    folder = ProjectFolder(project_id=project_id, name=payload.name, created_by=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete('/{project_id}/folders/{folder_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    project_id: int,
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_write_access(current_user, project)

    folder = db.get(ProjectFolder, folder_id)
    if not folder or folder.project_id != project_id:
        raise HTTPException(status_code=404, detail='Folder not found')

    is_lead = project.responsible_id == current_user.id
    if current_user.role != UserRole.admin and not is_lead:
        raise HTTPException(status_code=403, detail='Only admins or project leads can delete folders')

    file_count = db.scalar(select(func.count(ProjectFile.id)).where(ProjectFile.folder_id == folder_id)) or 0
    if file_count > 0:
        raise HTTPException(status_code=400, detail=f'Folder has {file_count} file(s). Delete them first.')

    db.delete(folder)
    db.commit()
