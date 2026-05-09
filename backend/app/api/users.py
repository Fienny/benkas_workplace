from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.file import ProjectFile
from app.models.folder import ProjectFolder
from app.models.project import Project
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.audit import log_action

router = APIRouter(prefix='/users', tags=['users'])


@router.get('/me', response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get('', response_model=list[UserResponse])
def list_users(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list(db.scalars(select(User).where(User.is_active.is_(True)).order_by(User.full_name)).all())


@router.post('', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if db.scalar(select(User).where(User.username == payload.username)):
        raise HTTPException(status_code=400, detail='Username already taken')
    user = User(
        full_name=payload.full_name,
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    log_action(db, admin, 'user.create', payload.username)
    db.commit()
    db.refresh(user)
    return user


@router.patch('/{user_id}', response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        user.role = payload.role
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.username is not None:
        if db.scalar(select(User).where(User.username == payload.username, User.id != user_id)):
            raise HTTPException(status_code=400, detail='Username already taken')
        user.username = payload.username
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    log_action(db, admin, 'user.update', user.username)
    db.commit()
    db.refresh(user)
    return user


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail='Cannot delete your own account')
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    # Reassign owned records to the admin before deleting to avoid FK violations
    db.execute(update(Project).where(Project.owner_id == user_id).values(owner_id=admin.id))
    db.execute(update(Project).where(Project.responsible_id == user_id).values(responsible_id=None))
    db.execute(update(ProjectFile).where(ProjectFile.uploaded_by == user_id).values(uploaded_by=admin.id))
    db.execute(update(ProjectFolder).where(ProjectFolder.created_by == user_id).values(created_by=admin.id))
    username = user.username
    db.delete(user)
    log_action(db, admin, 'user.delete', username)
    db.commit()
