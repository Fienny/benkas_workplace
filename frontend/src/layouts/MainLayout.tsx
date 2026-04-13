import { Activity, FolderKanban, LayoutDashboard, LogOut, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts'
import { api } from '../api/client'
import { setLanguage } from '../i18n'

interface Props {
  children: ReactNode
  onLogout: () => void
}

export function MainLayout({ children, onLogout }: Props) {
  const { user } = useUser()
  const { t, i18n } = useTranslation()

  const initials = user
    ? user.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-logo">◫</div>
            <div>
              <div className="brand-title">Benka's Workbench</div>
              <div className="brand-subtitle">{t('nav.subtitle')}</div>
            </div>
          </div>

          <nav className="nav-menu">
            <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <LayoutDashboard size={18} /> {t('nav.dashboard')}
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <FolderKanban size={18} /> {t('nav.projects')}
            </NavLink>
            <NavLink to="/activity" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <Activity size={18} /> {t('nav.activity')}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                <Shield size={18} /> {t('nav.adminPanel')}
              </NavLink>
            )}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name ?? '—'}</div>
              <div className="user-role">{user?.role === 'admin' ? t('nav.administrator') : t('nav.engineer')}</div>
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
          <button
            className="icon-btn logout-btn"
            title={t('nav.signOut')}
            onClick={async () => {
              await api.post('/auth/logout').catch(() => {})
              onLogout()
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  )
}
