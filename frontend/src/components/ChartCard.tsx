import { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
}

export function ChartCard({ title, children }: Props) {
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      <div className="chart-wrap">{children}</div>
    </section>
  )
}
