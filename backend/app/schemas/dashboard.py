from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: int | float


class ChartItem(BaseModel):
    label: str
    value: int | float


class ProgressItem(BaseModel):
    label: str
    value: int


class DashboardResponse(BaseModel):
    metrics: list[MetricCard]
    projects_by_type: list[ChartItem]
    projects_by_region: list[ChartItem]
    monthly_activity: list[dict]
    active_project_progress: list[ProgressItem]
