import { useEffect, useMemo, useState } from 'react'
import { Activity, CircleCheck, Files, FolderOpen, TrendingUp, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { fetchDashboard } from '../api/dashboard'
import { fetchProjects } from '../api/projects'
import { ChartCard } from '../components/ChartCard'
import { ProjectTable } from '../components/ProjectTable'
import { StatCard } from '../components/StatCard'
import { DashboardResponse, Project } from '../types'

const icons = [<FolderOpen size={18} />, <Activity size={18} />, <CircleCheck size={18} />, <Files size={18} />, <Users size={18} />, <TrendingUp size={18} />]
const chartColors = ['#3867d6', '#20bf6b', '#f0932b', '#eb4d4b', '#8854d0', '#0fb9b1']

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [dashboardData, projectData] = await Promise.all([fetchDashboard(), fetchProjects()])
        setDashboard(dashboardData)
        setProjects(projectData)
      } catch {
        localStorage.setItem('access_token', '')
      }
    }
    load()
  }, [])

  const metricCards = useMemo(() => dashboard?.metrics ?? [], [dashboard])

  if (!dashboard) {
    return <div className="page"><h1>Loading dashboard...</h1></div>
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of all projects, metrics and team activity</p>
        </div>
      </div>

      <div className="stats-grid">
        {metricCards.map((card, index) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={card.label === 'Avg Progress' ? `${card.value}%` : card.value}
            icon={icons[index]}
          />
        ))}
      </div>

      <div className="charts-grid two-columns">
        <ChartCard title="Projects by Type">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dashboard.projects_by_type} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} label>
                {dashboard.projects_by_type.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Projects by Region">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dashboard.projects_by_region}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3867d6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="charts-grid two-columns">
        <ChartCard title="Monthly Activity">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dashboard.monthly_activity}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="filesUploaded" stroke="#3867d6" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="newProjects" stroke="#20bf6b" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Active Projects Progress">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard.active_project_progress} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="label" width={100} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {dashboard.active_project_progress.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ProjectTable projects={projects} />
    </div>
  )
}
