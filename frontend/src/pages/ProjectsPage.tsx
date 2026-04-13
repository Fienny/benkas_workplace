import { useEffect, useState } from 'react'
import { Paperclip, Pencil, Plus, Trash2 } from 'lucide-react'
import { fetchProjects, deleteProject } from '../api/projects'
import { Project } from '../types'
import { FileManager } from '../components/FileManager'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { useUser } from '../contexts'

const STATUS_LABEL: Record<string, string> = { active: 'Active', completed: 'Completed', draft: 'Draft' }
const progressColor = (v: number) => v >= 80 ? '#20bf6b' : v >= 40 ? '#3867d6' : '#f0932b'

export function ProjectsPage() {
  const { user } = useUser()
  const isAdmin = user?.role === 'admin'
  const [projects, setProjects] = useState<Project[]>([])
  const [fileProject, setFileProject] = useState<Project | null>(null)
  const [formProject, setFormProject] = useState<Project | 'new' | null>(null)

  async function handleDelete(project: Project) {
    if (!confirm(`Delete project "${project.code} — ${project.title}"? This cannot be undone.`)) return
    await deleteProject(project.id)
    setProjects((prev) => prev.filter((p) => p.id !== project.id))
  }

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  function handleFileCountChange(projectId: number, delta: number) {
    setProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, file_count: p.file_count + delta } : p)
    )
  }

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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>Click the pencil to edit, the paperclip to manage files</p>
        </div>
        <button className="btn-primary" onClick={() => setFormProject('new')}>
          <Plus size={15} /> New Project
        </button>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Projects</h3>
          <span className="table-count">{projects.length} total</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Type</th>
                <th>Region</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Files</th>
                <th></th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
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
                        <div
                          className="progress-bar"
                          style={{ width: `${project.progress}%`, background: progressColor(project.progress) }}
                        />
                      </div>
                      <span className="progress-label">{project.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="file-btn"
                      onClick={() => setFileProject(project)}
                      title="Manage files"
                    >
                      <Paperclip size={14} />
                      {project.file_count > 0 && <span className="file-count">{project.file_count}</span>}
                    </button>
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      onClick={() => setFormProject(project)}
                      title="Edit project"
                    >
                      <Pencil size={14} />
                    </button>
                  </td>
                  {isAdmin && (
                    <td>
                      <button
                        className="icon-btn icon-btn-danger"
                        onClick={() => handleDelete(project)}
                        title="Delete project"
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

      {fileProject && (
        <FileManager
          projectId={fileProject.id}
          projectCode={fileProject.code}
          onClose={() => setFileProject(null)}
          onFileCountChange={handleFileCountChange}
        />
      )}

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
