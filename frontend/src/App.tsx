import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { AdminPage } from './pages/AdminPage'
import { ActivityPage } from './pages/ActivityPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { LoginPage } from './pages/LoginPage'
import { fetchMe } from './api/users'
import { UserContext } from './contexts'
import { User } from './types'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  // On load, check if there's an active session
  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <UserContext.Provider value={{ user }}>
      <MainLayout onLogout={() => setUser(null)}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/admin" element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </UserContext.Provider>
  )
}
