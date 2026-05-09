import { api } from './client'
import { User } from '../types'

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users')
  return data
}

export interface UserCreatePayload {
  full_name: string
  username: string
  password: string
  role: 'admin' | 'user'
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const { data } = await api.post<User>('/users', payload)
  return data
}

export async function updateUser(id: number, payload: { is_active?: boolean; role?: 'admin' | 'user' }): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, payload)
  return data
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}
