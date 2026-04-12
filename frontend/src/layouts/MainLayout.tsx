import { FolderKanban, LayoutDashboard, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ReactNode } from 'react'
import { useUser } from '../App'

export function MainLayout({ children }: { children: ReactNode }) {
  const { user } = useUser()

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
              <div className="brand-subtitle">Engineering Dashboard</div>
            </div>
          </div>

          <nav className="nav-menu">
            <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
              <FolderKanban size={18} /> Projects
            </NavLink>
            {user?.role === 'admin' && (
              <a className="nav-item" href="#">
                <Shield size={18} /> Admin Panel
              </a>
            )}
          </nav>
        </div>

        <div className="user-card">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.full_name ?? '—'}</div>
            <div className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Engineer'}</div>
          </div>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  )
}
