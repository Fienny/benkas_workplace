import { Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { loginDemo } from './api/auth'
import { fetchMe } from './api/users'
import { UserContext } from './contexts'
import { User } from './types'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function bootstrap() {
      const token = localStorage.getItem('access_token')
      if (!token) {
        await loginDemo()
      }
      try {
        const me = await fetchMe()
        setUser(me)
      } catch {
        // stale token — re-login
        await loginDemo()
        const me = await fetchMe()
        setUser(me)
      }
      setReady(true)
    }
    bootstrap().catch(() => setReady(true))
  }, [])

  if (!ready) {
    return <div style={{ padding: 24 }}>Loading...</div>
  }

  return (
    <UserContext.Provider value={{ user }}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </MainLayout>
    </UserContext.Provider>
  )
}
