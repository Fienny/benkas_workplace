import { Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { LoginPage } from './pages/LoginPage'
import { fetchMe } from './api/users'
import { UserContext } from './contexts'
import { User } from './types'

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'))
  const [user, setUser] = useState<User | null>(null)
  const [checkingToken, setCheckingToken] = useState(!!localStorage.getItem('access_token'))

  // When a stored token exists, validate it and fetch user info
  useEffect(() => {
    if (!token) return
    fetchMe()
      .then(setUser)
      .catch(() => {
        // token is stale — go back to login
        localStorage.removeItem('access_token')
        setToken(null)
      })
      .finally(() => setCheckingToken(false))
  }, [token])

  // No token → show login page
  if (!token) {
    return (
      <LoginPage onLogin={() => {
        setToken(localStorage.getItem('access_token'))
        setCheckingToken(true)
      }} />
    )
  }

  // Token exists but we're still verifying it
  if (checkingToken) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Verifying session…
      </div>
    )
  }

  return (
    <UserContext.Provider value={{ user }}>
      <MainLayout onLogout={() => {
        localStorage.removeItem('access_token')
        setToken(null)
        setUser(null)
      }}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </MainLayout>
    </UserContext.Provider>
  )
}
