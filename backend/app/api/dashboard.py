from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.file import ProjectFile
from app.models.project import Project
from app.models.user import User
from app.schemas.dashboard import ChartItem, DashboardResponse, MetricCard, ProgressItem

router = APIRouter(prefix='/dashboard', tags=['dashboard'])


@router.get('', response_model=DashboardResponse)
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _ = current_user

    total_projects = db.scalar(select(func.count(Project.id))) or 0
    active_projects = db.scalar(select(func.count(Project.id)).where(Project.status == 'active')) or 0
    completed_projects = db.scalar(select(func.count(Project.id)).where(Project.status == 'completed')) or 0
    total_files = db.scalar(select(func.count(ProjectFile.id))) or 0
    team_members = db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0
    avg_progress = db.scalar(select(func.avg(Project.progress))) or 0

    metrics = [
        MetricCard(label='Total Projects', value=total_projects),
        MetricCard(label='Active Projects', value=active_projects),
        MetricCard(label='Completed', value=completed_projects),
        MetricCard(label='Total Files', value=total_files),
        MetricCard(label='Team Members', value=team_members),
        MetricCard(label='Avg Progress', value=round(float(avg_progress))),
    ]

    type_rows = db.execute(select(Project.type, func.count(Project.id)).group_by(Project.type)).all()
    region_rows = db.execute(select(Project.region, func.count(Project.id)).group_by(Project.region)).all()

    monthly_project_rows = db.execute(
        select(extract('month', Project.created_at), func.count(Project.id))
        .group_by(extract('month', Project.created_at))
        .order_by(extract('month', Project.created_at))
    ).all()
    monthly_file_rows = db.execute(
        select(extract('month', ProjectFile.created_at), func.count(ProjectFile.id))
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
        .where(Project.status == 'active')
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
