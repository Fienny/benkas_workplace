import { api } from './client'
import { Project } from '../types'

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<Project[]>('/projects')
  return data
}
