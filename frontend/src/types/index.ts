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
  responsible_id?: number | null
  responsible_name?: string | null
  created_at: string
  file_count: number
}

export type ProjectFile = {
  id: number
  project_id: number
  folder_id: number | null
  uploaded_by: number
  original_name: string
  stored_name: string
  content_type: string | null
  file_size: number
  file_path: string
  created_at: string
}

export type ProjectFolder = {
  id: number
  project_id: number
  name: string
  created_by: number
  created_at: string
}

export type User = {
  id: number
  full_name: string
  username: string
  role: 'admin' | 'user' | 'client'
  is_active: boolean
  created_at: string
}

export type AuditLog = {
  id: number
  user_id: number
  user_name: string
  action: string
  entity_label: string
  context_label: string | null
  created_at: string
}
