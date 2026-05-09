import { api } from './client'
import { ProjectFile } from '../types'

export async function fetchProjectFiles(projectId: number): Promise<ProjectFile[]> {
  const { data } = await api.get<ProjectFile[]>(`/files/project/${projectId}`)
  return data
}

export async function uploadFile(projectId: number, file: File, folderId?: number | null): Promise<ProjectFile> {
  const form = new FormData()
  form.append('file', file)
  if (folderId != null) form.append('folder_id', String(folderId))
  const { data } = await api.post<ProjectFile>(`/files/project/${projectId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteFile(fileId: number): Promise<void> {
  await api.delete(`/files/${fileId}`)
}

export function downloadUrl(fileId: number): string {
  return `/api/v1/files/${fileId}/download`
}
