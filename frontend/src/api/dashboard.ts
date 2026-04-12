import { api } from './client'
import { DashboardResponse } from '../types'

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>('/dashboard')
  return data
}
