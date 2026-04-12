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
  const [bootError, setBootError] = useState<string | null>(null)
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
        // stale / missing token — re-login once
        localStorage.removeItem('access_token')
        await loginDemo()
        const me = await fetchMe()
        setUser(me)
      }
      setReady(true)
    }

    bootstrap().catch((err) => {
      const msg: string = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
        ? 'Cannot reach the backend (timeout). Is the server running on port 8000?'
        : err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')
        ? 'Cannot reach the backend. Is uvicorn running on port 8000?'
        : err?.response?.status === 401
        ? 'Login failed — run "python -m app.seed" in the backend folder, then reload.'
        : `Startup error: ${err?.response?.data?.detail ?? err?.message ?? 'unknown'}`
      setBootError(msg)
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 20 }}>Starting…</div>
        <div style={{ fontSize: 13 }}>Connecting to backend at localhost:8000</div>
      </div>
    )
  }

  if (bootError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Could not start the app</div>
        <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 480, lineHeight: 1.6 }}>{bootError}</div>
        <div style={{ fontSize: 13, color: '#9ca3af', background: '#f3f4f6', padding: '12px 20px', borderRadius: 10, maxWidth: 480, textAlign: 'left', lineHeight: 2 }}>
          <strong>Checklist:</strong><br />
          1. <code>docker compose up -d db</code><br />
          2. <code>cd backend &amp;&amp; python -m app.seed</code><br />
          3. <code>python -m uvicorn app.main:app --reload --port 8000</code>
        </div>
        <button
          onClick={() => { setBootError(null); setReady(false); window.location.reload() }}
          style={{ marginTop: 8, padding: '10px 24px', borderRadius: 10, background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    )
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
