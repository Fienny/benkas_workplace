import { BarChart3, FolderKanban, LayoutDashboard, Shield } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ReactNode } from 'react'

export function MainLayout({ children }: { children: ReactNode }) {
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

          <input className="search-box" placeholder="Search projects..." />

          <nav className="nav-menu">
            <NavLink to="/" className="nav-item"><LayoutDashboard size={18} /> Dashboard</NavLink>
            <NavLink to="/projects" className="nav-item"><FolderKanban size={18} /> Projects</NavLink>
            <a className="nav-item" href="#"><Shield size={18} /> Admin Panel</a>
          </nav>
        </div>

        <div className="user-card">
          <div className="avatar">AB</div>
          <div>
            <div className="user-name">Admin Benka</div>
            <div className="user-role">Admin</div>
          </div>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  )
}
