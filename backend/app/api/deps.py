from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.user import User, UserRole


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user_id = request.session.get('user_id')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Not authenticated')
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin access required')
    return current_user


def can_view_project(user: User, project: Project) -> bool:
    if user.role == UserRole.admin:
        return True
    if user.role == UserRole.user:
        return project.owner_id == user.id or project.responsible_id == user.id
    if user.role == UserRole.client:
        return any(access.project_id == project.id for access in user.client_project_accesses)
    return False


def require_project_access(user: User, project: Project) -> None:
    if not can_view_project(user, project):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Project access required')

