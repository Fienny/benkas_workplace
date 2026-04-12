import { Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { loginDemo } from './api/auth'

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('access_token')
      if (!token) {
        await loginDemo()
      }
      setReady(true)
    }
    bootstrap().catch(() => setReady(true))
  }, [])

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </MainLayout>
  )
}
