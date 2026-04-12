import { useEffect, useState } from 'react'
import { fetchProjects } from '../api/projects'
import { Project } from '../types'
import { ProjectTable } from '../components/ProjectTable'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Projects</h1>
          <p>Projects list from the backend</p>
        </div>
      </div>
      <ProjectTable projects={projects} />
    </div>
  )
}
