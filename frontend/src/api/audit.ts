import { api } from './client'
import { AuditLog } from '../types'

export async function fetchAuditLog(limit = 150): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLog[]>('/audit', { params: { limit } })
  return data
}
