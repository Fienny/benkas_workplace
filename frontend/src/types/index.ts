export type MetricCard = { label: string; value: number }
export type ChartItem = { label: string; value: number }
export type ProgressItem = { label: string; value: number }

export type DashboardResponse = {
  metrics: MetricCard[]
  projects_by_type: ChartItem[]
  projects_by_region: ChartItem[]
  monthly_activity: Array<{ month: string; filesUploaded: number; newProjects: number }>
  active_project_progress: ProgressItem[]
}

export type Project = {
  id: number
  code: string
  title: string
  type: string
  region: string
  status: string
  progress: number
  description?: string | null
  due_date?: string | null
  owner_id: number
  created_at: string
  file_count: number
}
