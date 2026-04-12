import { useEffect, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { fetchProjects } from '../api/projects'
import { Project } from '../types'
import { ProjectTable } from '../components/ProjectTable'
import { FileManager } from '../components/FileManager'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  function handleFileCountChange(projectId: number, delta: number) {
    setProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, file_count: p.file_count + delta } : p)
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>Full project list — click the file icon to manage attachments</p>
        </div>
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
                      {project.status === 'active' ? 'Active' : project.status === 'completed' ? 'Completed' : 'Draft'}
                    </span>
                  </td>
                  <td className="progress-cell">
                    <div className="progress-wrap">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${project.progress}%`,
                          background: project.progress >= 80 ? '#20bf6b' : project.progress >= 40 ? '#3867d6' : '#f0932b',
                        }}
                      />
                      <span className="progress-label">{project.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <button
                      className="file-btn"
                      onClick={() => setSelectedProject(project)}
                      title="Manage files"
                    >
                      <Paperclip size={14} />
                      {project.file_count > 0 && <span className="file-count">{project.file_count}</span>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProject && (
        <FileManager
          projectId={selectedProject.id}
          projectCode={selectedProject.code}
          onClose={() => setSelectedProject(null)}
          onFileCountChange={handleFileCountChange}
        />
      )}
    </div>
  )
}
