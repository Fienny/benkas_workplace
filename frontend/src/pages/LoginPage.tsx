import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { User } from '../types'
import { setLanguage } from '../i18n'

interface Props {
  onLogin: (user: User) => void
}

export function LoginPage({ onLogin }: Props) {
  const { t, i18n } = useTranslation()
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
        setError(t('login.errorWrongCreds'))
      } else if (status === 422) {
        setError(t('login.errorInvalid'))
      } else if (err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK') {
        setError(t('login.errorNetwork'))
      } else {
        setError(t('login.errorGeneric'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-card-top">
          <div className="login-brand">
            <div className="brand-logo" style={{ width: 44, height: 44, fontSize: 22 }}>◫</div>
            <div>
              <div className="brand-title" style={{ fontSize: 16 }}>Benka's Workbench</div>
              <div className="brand-subtitle">{t('nav.subtitle')}</div>
            </div>
          </div>
          <div className="lang-switch">
            <button
              className={`lang-btn${i18n.language === 'en' ? ' active' : ''}`}
              onClick={() => setLanguage('en')}
            >EN</button>
            <button
              className={`lang-btn${i18n.language === 'ru' ? ' active' : ''}`}
              onClick={() => setLanguage('ru')}
            >RU</button>
          </div>
        </div>

        <h2 className="login-heading">{t('login.heading')}</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>{t('login.username')}</label>
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
            <label>{t('login.password')}</label>
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
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        <p className="login-hint">
          {t('login.hint', { user: 'admin', pass: 'admin' })}
        </p>
      </div>
    </div>
  )
}
