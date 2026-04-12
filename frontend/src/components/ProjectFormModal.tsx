import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Project } from '../types'
import { createProject, updateProject, ProjectPayload } from '../api/projects'

interface Props {
  project?: Project        // if set → edit mode, else → create mode
  onClose: () => void
  onSaved: (project: Project) => void
}

const STATUS_OPTIONS = ['active', 'draft', 'completed']

const EMPTY: ProjectPayload = {
  code: '',
  title: '',
  type: '',
  region: '',
  status: 'active',
  progress: 0,
  description: '',
  due_date: '',
}

export function ProjectFormModal({ project, onClose, onSaved }: Props) {
  const isEdit = !!project
  const [form, setForm] = useState<ProjectPayload>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      })
    } else {
      setForm(EMPTY)
    }
  }, [project])

  function set(field: keyof ProjectPayload, value: string | number) {
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
      setError(typeof detail === 'string' ? detail : 'Save failed. Check all fields and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="file-manager-overlay" onClick={onClose}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-manager-head">
          <div>
            <h3>{isEdit ? 'Edit Project' : 'New Project'}</h3>
            {isEdit && <p className="file-manager-sub">{project!.code}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} type="button"><X size={18} /></button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <div className="form-row two">
            <div className="form-field">
              <label>Code *</label>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="EA-AND-6001"
                required
                maxLength={50}
              />
            </div>
            <div className="form-field">
              <label>Region *</label>
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
            <label>Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Project title"
              required
              maxLength={255}
            />
          </div>

          <div className="form-field">
            <label>Type *</label>
            <input
              value={form.type}
              onChange={(e) => set('type', e.target.value)}
              placeholder="Project / Special Technical Conditions / …"
              required
              maxLength={120}
            />
          </div>

          <div className="form-row two">
            <div className="form-field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Progress — {form.progress}%</label>
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
              <label>Due Date</label>
              <input
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
            <div className="form-field" />
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional notes…"
              rows={3}
            />
          </div>

          {error && <p className="upload-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
