import { ReactNode } from 'react'

interface Props {
  title: string
  value: string | number
  icon: ReactNode
}

export function StatCard({ title, value, icon }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  )
}
