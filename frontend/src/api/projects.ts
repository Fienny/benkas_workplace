import { api } from './client'
import { Project } from '../types'

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects')
  return data
}

export interface ProjectPayload {
  code: string
  title: string
  type: string
  region: string
  status: string
  progress: number
  description?: string
  due_date?: string
  responsible_id?: number | null
}

export async function createProject(payload: ProjectPayload): Promise<Project> {
  const { data } = await api.post<Project>('/projects', payload)
  return data
}

export async function updateProject(id: number, payload: Partial<ProjectPayload>): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, payload)
  return data
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`)
}
