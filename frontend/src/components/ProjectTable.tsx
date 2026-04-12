import { Project } from '../types'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  draft: 'Draft',
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? '#20bf6b' : value >= 40 ? '#3867d6' : '#f0932b'
  return (
    <div className="progress-wrap">
      <div className="progress-bar" style={{ width: `${value}%`, background: color }} />
      <span className="progress-label">{value}%</span>
    </div>
  )
}

export function ProjectTable({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="table-card">
        <div className="table-header"><h3>Projects</h3></div>
        <p className="empty-state">No projects found.</p>
      </div>
    )
  }

  return (
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
                    {STATUS_LABEL[project.status.toLowerCase()] ?? project.status}
                  </span>
                </td>
                <td className="progress-cell">
                  <ProgressBar value={project.progress} />
                </td>
                <td className="files-cell">
                  {project.file_count > 0
                    ? <span className="file-count">{project.file_count}</span>
                    : <span className="muted-cell">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
