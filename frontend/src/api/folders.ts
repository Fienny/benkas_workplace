import { api } from './client'
import { ProjectFolder } from '../types'

export async function fetchFolders(projectId: number): Promise<ProjectFolder[]> {
  const { data } = await api.get<ProjectFolder[]>(`/projects/${projectId}/folders`)
  return data
}

export async function createFolder(projectId: number, name: string): Promise<ProjectFolder> {
  const { data } = await api.post<ProjectFolder>(`/projects/${projectId}/folders`, { name })
  return data
}

export async function deleteFolder(projectId: number, folderId: number): Promise<void> {
  await api.delete(`/projects/${projectId}/folders/${folderId}`)
}
