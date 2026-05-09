import axios from 'axios'

// Relative URL — Vite dev server proxies /api → http://127.0.0.1:8000
// withCredentials lets the session cookie travel with every request
export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 8000,
  withCredentials: true,
})
