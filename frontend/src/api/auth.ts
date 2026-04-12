import { api } from './client'

export async function loginDemo() {
  const { data } = await api.post('/auth/login', {
    email: 'admin@benka.local',
    password: 'Admin123!',
  })
  localStorage.setItem('access_token', data.access_token)
}
