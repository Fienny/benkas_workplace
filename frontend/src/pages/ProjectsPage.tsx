import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { fetchProjects, deleteProject } from '../api/projects'
import { Project } from '../types'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { useUser } from '../contexts'

const progressColor = (v: number) => v >= 80 ? '#20bf6b' : v >= 40 ? '#3867d6' : '#f0932b'

export function ProjectsPage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [projects, setProjects] = useState<Project[]>([])
  const [formProject, setFormProject] = useState<Project | 'new' | null>(null)

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  function handleSaved(saved: Project) {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setFormProject(null)
  }

  async function handleDelete(e: React.MouseEvent, project: Project) {
    e.stopPropagation()
    if (!confirm(t('projects.confirmDelete', { code: project.code, title: project.title }))) return
    await deleteProject(project.id)
    setProjects((prev) => prev.filter((p) => p.id !== project.id))
  }

  const STATUS_LABEL: Record<string, string> = {
    active:    t('projects.statusActive'),
    completed: t('projects.statusCompleted'),
    draft:     t('projects.statusDraft'),
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('projects.title')}</h1>
          <p>{t('projects.subtitle')}</p>
        </div>
        <button className="btn-primary" onClick={() => setFormProject('new')}>
          <Plus size={15} /> {t('projects.newProject')}
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>{t('projects.title')}</h3>
          <span className="table-count">{t('projects.total', { count: projects.length })}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t('projects.colCode')}</th>
                <th>{t('projects.colTitle')}</th>
                <th>{t('projects.colType')}</th>
                <th>{t('projects.colRegion')}</th>
                <th>{t('projects.colStatus')}</th>
                <th>{t('projects.colProgress')}</th>
                <th>{t('projects.colLead')}</th>
                <th>{t('projects.colFiles')}</th>
                <th></th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="project-row-clickable"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td><code className="code-cell">{project.code}</code></td>
                  <td className="title-cell">{project.title}</td>
                  <td className="muted-cell">{project.type}</td>
                  <td><span className="region-badge">{project.region}</span></td>
                  <td>
                    <span className={`status-chip ${project.status.toLowerCase()}`}>
                      {STATUS_LABEL[project.status.toLowerCase()] ?? project.status}
                    </span>
                  </td>
                  <td className="progress-cell">
                    <div className="progress-wrap">
                      <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${project.progress}%`, background: progressColor(project.progress) }} />
                      </div>
                      <span className="progress-label">{project.progress}%</span>
                    </div>
                  </td>
                  <td>
                    {project.responsible_name
                      ? <span className="lead-badge" title={project.responsible_name}>{project.responsible_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                      : <span className="muted-cell">—</span>
                    }
                  </td>
                  <td>
                    <span className={`file-count-badge${project.file_count > 0 ? ' has-files' : ''}`}>
                      {project.file_count}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={(e) => { e.stopPropagation(); setFormProject(project) }}
                      title={t('projectForm.titleEdit')}
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={(e) => handleDelete(e, project)}
                        title={t('admin.tipDelete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formProject && (
        <ProjectFormModal
          project={formProject === 'new' ? undefined : formProject}
          onClose={() => setFormProject(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
