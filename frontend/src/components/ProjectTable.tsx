import { Project } from '../types'

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Projects</h3>
      </div>
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
              <td>{project.code}</td>
              <td>{project.title}</td>
              <td>{project.type}</td>
              <td>{project.region}</td>
              <td>
                <span className={`status-chip ${project.status.toLowerCase()}`}>{project.status}</span>
              </td>
              <td>{project.progress}%</td>
              <td>{project.file_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
