import axios from 'axios'

// Use relative URL — Vite dev server proxies /api → http://127.0.0.1:8000
// This avoids the Windows localhost IPv6 vs IPv4 mismatch that caused
// requests to bypass uvicorn silently.
export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 8000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
