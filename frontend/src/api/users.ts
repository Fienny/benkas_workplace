import { api } from './client'
import { User } from '../types'

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}
