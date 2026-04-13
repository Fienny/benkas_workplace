import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Project, User } from '../types'
import { createProject, updateProject, ProjectPayload } from '../api/projects'
import { fetchUsers } from '../api/users'
import { useUser } from '../contexts'

interface Props {
  project?: Project
  onClose: () => void
  onSaved: (project: Project) => void
}

const EMPTY: ProjectPayload = {
  code: '',
  title: '',
  type: '',
  region: '',
  status: 'active',
  progress: 0,
  description: '',
  due_date: '',
  responsible_id: null,
}

export function ProjectFormModal({ project, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { user } = useUser()
  const isAdmin = user?.role === 'admin'
  const isEdit = !!project
  const [form, setForm] = useState<ProjectPayload>(EMPTY)
  const [users, setUsers] = useState<User[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const STATUS_OPTIONS = [
    { value: 'active',    label: t('projectForm.statusActive') },
    { value: 'draft',     label: t('projectForm.statusDraft') },
    { value: 'completed', label: t('projectForm.statusCompleted') },
  ]

  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (project) {
      setForm({
        code: project.code,
        title: project.title,
        type: project.type,
        region: project.region,
        status: project.status,
        progress: project.progress,
        description: project.description ?? '',
        due_date: project.due_date ?? '',
        responsible_id: project.responsible_id ?? null,
      })
    } else {
      setForm(EMPTY)
    }
  }, [project])

  function set(field: keyof ProjectPayload, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload: ProjectPayload = {
      ...form,
      region: form.region.toUpperCase(),
      due_date: form.due_date || undefined,
      description: form.description || undefined,
    }

    try {
      let saved: Project
      if (isEdit) {
        saved = await updateProject(project!.id, payload)
        saved = { ...saved, file_count: project!.file_count }
      } else {
        saved = await createProject(payload)
      }
      onSaved(saved)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('projectForm.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="file-manager-overlay" onClick={onClose}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-manager-head">
          <div>
            <h3>{isEdit ? t('projectForm.titleEdit') : t('projectForm.titleNew')}</h3>
            {isEdit && <p className="file-manager-sub">{project!.code}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-row two">
            <div className="form-field">
              <label>{t('projectForm.fieldCode')}</label>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="EA-AND-6001"
                required
                maxLength={50}
              />
            </div>
            <div className="form-field">
              <label>{t('projectForm.fieldRegion')}</label>
              <input
                value={form.region}
                onChange={(e) => set('region', e.target.value)}
                placeholder="AND"
                required
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-field">
            <label>{t('projectForm.fieldTitle')}</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={t('projectForm.fieldTitle')}
              required
              maxLength={255}
            />
          </div>

          <div className="form-field">
            <label>{t('projectForm.fieldType')}</label>
            <input
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              placeholder={t('projectForm.placeholderType')}
              required
              maxLength={120}
            />
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>{t('projectForm.fieldStatus')}</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>{t('projectForm.fieldProgress', { value: form.progress })}</label>
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => set('progress', Number(e.target.value))}
                className="progress-slider"
              />
            </div>
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>{t('projectForm.fieldDueDate')}</label>
              <input
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>{t('projectForm.fieldLead')}</label>
              {isAdmin ? (
                <select
                  value={form.responsible_id ?? ''}
                  onChange={(e) => set('responsible_id', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t('projectForm.noLead')}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={users.find((u) => u.id === form.responsible_id)?.full_name ?? t('projectForm.noLead')}
                  readOnly
                  style={{ background: '#f9fafb', color: '#6b7280' }}
                />
              )}
            </div>
          </div>

          <div className="form-field">
            <label>{t('projectForm.fieldDescription')}</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('projectForm.placeholderNotes')}
              rows={3}
            />
          </div>

          {error && <p className="upload-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              {t('projectForm.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? t('projectForm.saving') : isEdit ? t('projectForm.saveChanges') : t('projectForm.createProject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
