import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchUserProjectAccess,
  updateUserProjectAccess,
  UserCreatePayload,
  UserRole,
} from '../api/users'
import { fetchProjects } from '../api/projects'
import { useUser } from '../contexts'
import { Project, User } from '../types'

const BLANK: UserCreatePayload = { full_name: '', username: '', password: '', role: 'user' }

interface EditForm { full_name: string; username: string; password: string; role: UserRole }

function selectedValues(select: HTMLSelectElement): number[] {
  return Array.from(select.selectedOptions, (option) => Number(option.value)).filter(Number.isFinite)
}

export function AdminPage() {
  const { t } = useTranslation()
  const { user: me } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UserCreatePayload>(BLANK)
  const [formProjectIds, setFormProjectIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ full_name: '', username: '', password: '', role: 'user' })
  const [editProjectIds, setEditProjectIds] = useState<number[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchUsers().then(setUsers),
      fetchProjects().then(setProjects),
    ])
      .catch(() => {
        setUsers([])
        setProjects([])
      })
      .finally(() => setLoading(false))
  }, [])

  function initials(name: string) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  }

  function roleLabel(role: UserRole) {
    if (role === 'admin') return t('admin.roleAdmin')
    if (role === 'client') return t('admin.roleClient')
    return t('admin.roleEngineer')
  }

  function resetCreateForm() {
    setForm(BLANK)
    setFormProjectIds([])
    setFormError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const created = await createUser(form)
      if (created.role === 'client') {
        await updateUserProjectAccess(created.id, formProjectIds)
      }
      setUsers((prev) => [created, ...prev])
      resetCreateForm()
      setShowForm(false)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setFormError(typeof detail === 'string' ? detail : t('admin.errorCreate'))
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
    if (updated.role !== 'client') await updateUserProjectAccess(updated.id, [])
    setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
  }

  async function openEdit(u: User) {
    setEditUser(u)
    setEditForm({ full_name: u.full_name, username: u.username, password: '', role: u.role })
    setEditProjectIds([])
    setEditError(null)
    if (u.role === 'client') {
      try {
        setEditProjectIds(await fetchUserProjectAccess(u.id))
      } catch (err: any) {
        const detail = err?.response?.data?.detail
        setEditError(typeof detail === 'string' ? detail : t('admin.errorProjectAccess'))
      }
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editUser) return
    setEditSaving(true)
    setEditError(null)
    try {
      const payload: { full_name: string; username: string; password?: string; role: UserRole } = {
        full_name: editForm.full_name,
        username: editForm.username,
        role: editForm.role,
      }
      if (editForm.password) payload.password = editForm.password
      const updated = await updateUser(editUser.id, payload)
      await updateUserProjectAccess(updated.id, updated.role === 'client' ? editProjectIds : [])
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setEditUser(null)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setEditError(typeof detail === 'string' ? detail : t('admin.errorCreate'))
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete(u: User) {
    if (!confirm(t('admin.confirmDelete', { username: u.username }))) return
    await deleteUser(u.id)
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
  }

  const projectAccessSelect = (value: number[], onChange: (ids: number[]) => void) => (
    <div className="form-field admin-project-access-field">
      <label>{t('admin.fieldProjectAccess')}</label>
      <select
        multiple
        value={value.map(String)}
        onChange={(e) => onChange(selectedValues(e.currentTarget))}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>{project.code} — {project.title}</option>
        ))}
      </select>
      <small>{t('admin.projectAccessHint')}</small>
    </div>
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('admin.title')}</h1>
          <p>{t('admin.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); resetCreateForm() }}>
          <Plus size={15} /> {t('admin.newUser')}
        </button>
      </div>

      {showForm && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header">
            <h3>{t('admin.createUserTitle')}</h3>
            <button className="icon-btn" onClick={() => setShowForm(false)} title={t('admin.cancel')}>✕</button>
          </div>
          <form className="admin-form" onSubmit={handleCreate}>
            <div className="admin-form-row">
              <div className="form-field">
                <label>{t('admin.fieldFullName')}</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder={t('admin.placeholderFullName')}
                  required
                />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldUsername')}</label>
                <input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="jsmith"
                  required
                />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldPassword')}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={t('admin.placeholderPassword')}
                  required
                />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldRole')}</label>
                <select
                  value={form.role}
                  onChange={(e) => {
                    const role = e.target.value as UserRole
                    setForm({ ...form, role })
                    if (role !== 'client') setFormProjectIds([])
                  }}
                >
                  <option value="user">{t('admin.roleEngineer')}</option>
                  <option value="admin">{t('admin.roleAdmin')}</option>
                  <option value="client">{t('admin.roleClient')}</option>
                </select>
              </div>
            </div>
            {form.role === 'client' && projectAccessSelect(formProjectIds, setFormProjectIds)}
            {formError && <p className="upload-error" style={{ margin: '8px 0 0' }}>{formError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t('admin.creating') : t('admin.createUser')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {editUser && (
        <div className="table-card" style={{ marginBottom: 20 }}>
          <div className="table-header">
            <h3>{t('admin.editUserTitle')} — {editUser.username}</h3>
            <button className="icon-btn" onClick={() => setEditUser(null)}>✕</button>
          </div>
          <form className="admin-form" onSubmit={handleEdit}>
            <div className="admin-form-row">
              <div className="form-field">
                <label>{t('admin.fieldFullName')}</label>
                <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldUsername')}</label>
                <input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} required />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldNewPassword')}</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder={t('admin.placeholderNewPassword')}
                />
              </div>
              <div className="form-field">
                <label>{t('admin.fieldRole')}</label>
                <select
                  value={editForm.role}
                  onChange={(e) => {
                    const role = e.target.value as UserRole
                    setEditForm({ ...editForm, role })
                    if (role !== 'client') setEditProjectIds([])
                  }}
                  disabled={editUser.id === me?.id}
                >
                  <option value="user">{t('admin.roleEngineer')}</option>
                  <option value="admin">{t('admin.roleAdmin')}</option>
                  <option value="client">{t('admin.roleClient')}</option>
                </select>
              </div>
            </div>
            {editForm.role === 'client' && projectAccessSelect(editProjectIds, setEditProjectIds)}
            {editError && <p className="upload-error" style={{ margin: '8px 0 0' }}>{editError}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="submit" className="btn-primary" disabled={editSaving}>
                {editSaving ? t('admin.saving') : t('admin.saveChanges')}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>{t('admin.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <h3>{t('admin.colUser')}</h3>
          <span className="table-count">{t('admin.total', { count: users.length })}</span>
        </div>
        {loading ? (
          <p className="empty-state">{t('admin.loading')}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('admin.colUser')}</th>
                  <th>{t('admin.colUsername')}</th>
                  <th>{t('admin.colRole')}</th>
                  <th>{t('admin.colStatus')}</th>
                  <th>{t('admin.colJoined')}</th>
                  <th>{t('admin.colActions')}</th>
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
                        {u.id === me?.id && (
                          <span className="region-badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                            {t('admin.labelYou')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td><code className="code-cell">{u.username}</code></td>
                    <td>
                      <span className={`status-chip role-${u.role}`}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${u.is_active ? 'active' : 'draft'}`}>
                        {u.is_active ? t('admin.statusActive') : t('admin.statusInactive')}
                      </span>
                    </td>
                    <td className="muted-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="icon-btn"
                          title={t('admin.tipEdit')}
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          title={u.role === 'admin' ? t('admin.tipDemote') : t('admin.tipPromote')}
                          onClick={() => handleToggleRole(u)}
                          disabled={u.id === me?.id || u.role === 'client'}
                        >
                          {u.role === 'admin' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        </button>
                        <button
                          className="icon-btn"
                          title={u.is_active ? t('admin.tipDeactivate') : t('admin.tipActivate')}
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          title={t('admin.tipDelete')}
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
