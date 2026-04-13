import { useState } from 'react'
import { api } from '../api/client'
import { User } from '../types'

interface Props {
  onLogin: (user: User) => void
}

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post<User>('/auth/login', { username, password })
      onLogin(data)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) {
        setError('Wrong username or password.')
      } else if (status === 422) {
        setError('Invalid input — check username and password fields.')
      } else if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK') {
        setError('Cannot reach the backend. Is uvicorn running on port 8000?')
      } else {
        setError('Login failed. Check that the backend is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo" style={{ width: 44, height: 44, fontSize: 22 }}>◫</div>
          <div>
            <div className="brand-title" style={{ fontSize: 16 }}>Benka's Workbench</div>
            <div className="brand-subtitle">Engineering Dashboard</div>
          </div>
        </div>

        <h2 className="login-heading">Sign in</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(null) }}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="upload-error">{error}</p>}

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">
          Default: <code>admin</code> / <code>admin</code>
        </p>
      </div>
    </div>
  )
}
