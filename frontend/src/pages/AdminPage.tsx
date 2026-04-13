import { useEffect, useState } from 'react'
import { Plus, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react'
import { fetchUsers, createUser, updateUser, deleteUser, UserCreatePayload } from '../api/users'
import { useUser } from '../contexts'
import { User } from '../types'

const ROLE_LABEL: Record<string, string> = { admin: 'Admin', user: 'Engineer' }

const BLANK: UserCreatePayload = { full_name: '', username: '', password: '', role: 'user' }

export function AdminPage() {
  const { user: me } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UserCreatePayload>(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const created = await createUser(form)
      setUsers((prev) => [created, ...prev])
      setForm(BLANK)
      setShowForm(false)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setFormError(typeof detail === 'string' ? detail : 'Failed to create user.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(u: User) {
    const updated = await updateUser(u.id, { is_active: !u.is_active })
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }

  async function handleToggleRole(u: User) {
    const updated = await updateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }

  async function handleDelete(u: User) {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
    await deleteUser(u.id)
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Admin Panel</h1>
          <p>Manage user accounts and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setForm(BLANK); setFormError(null) }}>
          <Plus size={15} /> New User
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header">
            <h3>Create user</h3>
            <button className="icon-btn" onClick={() => setShowForm(false)} title="Cancel">✕</button>
          </div>
          <form className="admin-form" onSubmit={handleCreate}>
            <div className="admin-form-row">
              <div className="form-field">
                <label>Full name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="form-field">
                <label>Username</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="jsmith"
                  required
                />
              </div>
              <div className="form-field">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="min 4 characters"
                  required
                />
              </div>
              <div className="form-field">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'user' })}>
                  <option value="user">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {formError && <p className="upload-error" style={{ margin: '8px 0 0' }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Creating…' : 'Create user'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>Users</h3>
          <span className="table-count">{users.length} total</span>
        </div>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
                          {initials(u.full_name)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.full_name}</span>
                        {u.id === me?.id && <span className="region-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>you</span>}
                      </div>
                    </td>
                    <td><code className="code-cell">{u.username}</code></td>
                    <td>
                      <span className={`status-chip ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${u.is_active ? 'active' : 'draft'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="muted-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="icon-btn"
                          title={u.role === 'admin' ? 'Demote to Engineer' : 'Promote to Admin'}
                          onClick={() => handleToggleRole(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                        <button
                          className="icon-btn"
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          title="Delete user"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === me?.id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
