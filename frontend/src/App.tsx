import { Route, Routes } from 'react-router-dom'
import { createContext, useContext, useEffect, useState } from 'react'
import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { loginDemo } from './api/auth'
import { fetchMe } from './api/users'
import { User } from './types'

type UserContextType = { user: User | null }
export const UserContext = createContext<UserContextType>({ user: null })
export const useUser = () => useContext(UserContext)

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function bootstrap() {
      let token = localStorage.getItem('access_token')
      if (!token) {
        await loginDemo()
      }
      try {
        const me = await fetchMe()
        setUser(me)
      } catch {
        // token stale – re-login
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
