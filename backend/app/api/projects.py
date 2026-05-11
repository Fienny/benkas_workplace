from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin, require_project_access, require_project_write_access
from app.db.session import get_db
from app.models.client_project_access import ClientProjectAccess
from app.models.file import ProjectFile
from app.models.folder import ProjectFolder
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectKpiResponse, ProjectResponse, ProjectUpdate
from app.services.audit import log_action

router = APIRouter(prefix='/projects', tags=['projects'])


@router.get('', response_model=list[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        select(Project, func.count(ProjectFile.id).label('file_count'))
        .outerjoin(ProjectFile, Project.id == ProjectFile.project_id)
    )

    if current_user.role == UserRole.user:
        query = query.where(
            (Project.owner_id == current_user.id) | (Project.responsible_id == current_user.id)
        )
    elif current_user.role == UserRole.client:
        query = query.join(
            ClientProjectAccess,
            ClientProjectAccess.project_id == Project.id,
        ).where(ClientProjectAccess.user_id == current_user.id)

    rows = db.execute(
        query.group_by(Project.id).order_by(Project.created_at.desc())
    ).all()
    result = []
    for project, file_count in rows:
        item = ProjectResponse.model_validate(project)
        item.file_count = file_count
        item.responsible_name = project.responsible.full_name if project.responsible else None
        result.append(item)
    return result


@router.post('', response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.client:
        raise HTTPException(status_code=403, detail='Clients cannot create projects')

    existing = db.scalar(select(Project).where(Project.code == payload.code))
    if existing:
        raise HTTPException(status_code=400, detail='Project code already exists')

    project = Project(**payload.model_dump(), owner_id=current_user.id)
    db.add(project)
    log_action(db, current_user, 'project.create', payload.code)
    db.commit()
    db.refresh(project)
    response = ProjectResponse.model_validate(project)
    response.file_count = 0
    return response


@router.get('/{project_id}/kpis', response_model=ProjectKpiResponse)
def get_project_kpis(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_access(current_user, project)

    total_files = db.scalar(select(func.count(ProjectFile.id)).where(ProjectFile.project_id == project_id)) or 0
    total_folders = db.scalar(select(func.count(ProjectFolder.id)).where(ProjectFolder.project_id == project_id)) or 0
    object_folders_created = db.scalar(
        select(func.count(ProjectFolder.id)).where(
            ProjectFolder.project_id == project_id,
            ProjectFolder.is_object_folder.is_(True),
        )
    ) or 0
    average_object_progress = db.scalar(
        select(func.avg(ProjectFolder.progress)).where(
            ProjectFolder.project_id == project_id,
            ProjectFolder.is_object_folder.is_(True),
        )
    ) or 0

    average_object_progress = round(float(average_object_progress), 2)
    return ProjectKpiResponse(
        total_files=total_files,
        total_folders=total_folders,
        planned_objects_count=project.planned_objects_count,
        object_folders_created=object_folders_created,
        missing_object_folders=project.planned_objects_count - object_folders_created,
        average_object_progress=average_object_progress,
        project_progress=average_object_progress,
    )


@router.get('/{project_id}', response_model=ProjectResponse)
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = current_user
    row = db.execute(
        select(Project, func.count(ProjectFile.id).label('file_count'))
        .outerjoin(ProjectFile, Project.id == ProjectFile.project_id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    ).one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail='Project not found')
    project, file_count = row
    require_project_access(current_user, project)
    response = ProjectResponse.model_validate(project)
    response.file_count = file_count
    response.responsible_name = project.responsible.full_name if project.responsible else None
    return response


@router.patch('/{project_id}', response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    require_project_write_access(current_user, project)

    updates = payload.model_dump(exclude_unset=True)
    if 'code' in updates and updates['code'] != project.code:
        clash = db.scalar(select(Project).where(Project.code == updates['code']))
        if clash:
            raise HTTPException(status_code=400, detail='Project code already exists')

    for key, value in updates.items():
        setattr(project, key, value)

    log_action(db, current_user, 'project.update', project.code)
    db.commit()
    db.refresh(project)
    response = ProjectResponse.model_validate(project)
    response.file_count = db.scalar(select(func.count(ProjectFile.id)).where(ProjectFile.project_id == project.id)) or 0
    response.responsible_name = project.responsible.full_name if project.responsible else None
    return response


@router.delete('/{project_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail='Project not found')
    code = project.code
    db.delete(project)
    log_action(db, admin, 'project.delete', code)
    db.commit()
