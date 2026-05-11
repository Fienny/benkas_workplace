from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import distinct, extract, func, select, union_all
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.client_project_access import ClientProjectAccess
from app.models.file import ProjectFile
from app.models.project import Project
from app.models.user import User, UserRole
from app.api.deps import get_current_user
from app.schemas.dashboard import ChartItem, DashboardResponse, MetricCard, ProgressItem

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


def scoped_project_ids(current_user: User):
    query = select(Project.id)
    if current_user.role == UserRole.user:
        query = query.where(
            (Project.owner_id == current_user.id) | (Project.responsible_id == current_user.id)
        )
    elif current_user.role == UserRole.client:
        query = query.join(
            ClientProjectAccess,
            ClientProjectAccess.project_id == Project.id,
        ).where(ClientProjectAccess.user_id == current_user.id)
    return query


@router.get('', response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project_ids = scoped_project_ids(current_user)
    project_filter = Project.id.in_(project_ids)
    file_project_filter = ProjectFile.project_id.in_(project_ids)

    total_projects = db.scalar(select(func.count(Project.id)).where(project_filter)) or 0
    active_projects = db.scalar(select(func.count(Project.id)).where(project_filter, Project.status == 'active')) or 0
    completed_projects = db.scalar(select(func.count(Project.id)).where(project_filter, Project.status == 'completed')) or 0
    total_files = db.scalar(select(func.count(ProjectFile.id)).where(file_project_filter)) or 0
    avg_progress = db.scalar(select(func.avg(Project.progress)).where(project_filter)) or 0

    project_user_ids = union_all(
        select(Project.owner_id.label('user_id')).where(project_filter),
        select(Project.responsible_id.label('user_id')).where(project_filter, Project.responsible_id.is_not(None)),
    ).subquery()
    team_members = db.scalar(
        select(func.count(distinct(User.id))).where(
            User.is_active.is_(True),
            User.id.in_(select(project_user_ids.c.user_id)),
        )
    ) or 0

    metrics = [
        MetricCard(label='Total Projects', value=total_projects),
        MetricCard(label='Active Projects', value=active_projects),
        MetricCard(label='Completed', value=completed_projects),
        MetricCard(label='Total Files', value=total_files),
        MetricCard(label='Team Members', value=team_members),
        MetricCard(label='Avg Progress', value=round(float(avg_progress))),
    ]

    type_rows = db.execute(
        select(Project.type, func.count(Project.id))
        .where(project_filter)
        .group_by(Project.type)
    ).all()
    region_rows = db.execute(
        select(Project.region, func.count(Project.id))
        .where(project_filter)
        .group_by(Project.region)
    ).all()

    monthly_project_rows = db.execute(
        select(extract('month', Project.created_at), func.count(Project.id))
        .where(project_filter)
        .group_by(extract('month', Project.created_at))
        .order_by(extract('month', Project.created_at))
    ).all()
    monthly_file_rows = db.execute(
        select(extract('month', ProjectFile.created_at), func.count(ProjectFile.id))
        .where(file_project_filter)
        .group_by(extract('month', ProjectFile.created_at))
        .order_by(extract('month', ProjectFile.created_at))
    ).all()

    project_map = {int(month): count for month, count in monthly_project_rows}
    file_map = {int(month): count for month, count in monthly_file_rows}

    current_month = datetime.utcnow().month
    month_indexes = [((current_month - i - 1) % 12) + 1 for i in range(6)][::-1]
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    monthly_activity = [
        {
            'month': month_names[m - 1],
            'newProjects': project_map.get(m, 0),
            'filesUploaded': file_map.get(m, 0),
        }
        for m in month_indexes
    ]

    progress_rows = db.execute(
        select(Project.code, Project.progress)
        .where(project_filter, Project.status == 'active')
        .order_by(Project.progress.desc(), Project.created_at.desc())
        .limit(6)
    ).all()

    return DashboardResponse(
        metrics=metrics,
        projects_by_type=[ChartItem(label=label, value=value) for label, value in type_rows],
        projects_by_region=[ChartItem(label=label, value=value) for label, value in region_rows],
        monthly_activity=monthly_activity,
        active_project_progress=[ProgressItem(label=label, value=value) for label, value in progress_rows],
    )
