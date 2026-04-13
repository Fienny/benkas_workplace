import { useEffect, useState } from 'react'
import { RefreshCw, Upload, Trash2, FolderPlus, Pencil, FolderMinus, UserPlus, UserCog, UserMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { fetchAuditLog } from '../api/audit'
import { AuditLog } from '../types'

type ActionMeta = { icon: React.ReactNode; color: string; bg: string }

const ACTION_META: Record<string, ActionMeta> = {
  'file.upload':    { icon: <Upload size={14} />,      color: '#1d4ed8', bg: '#eff6ff' },
  'file.delete':    { icon: <Trash2 size={14} />,      color: '#dc2626', bg: '#fee2e2' },
  'project.create': { icon: <FolderPlus size={14} />,  color: '#16a34a', bg: '#dcfce7' },
  'project.update': { icon: <Pencil size={14} />,      color: '#d97706', bg: '#fef3c7' },
  'project.delete': { icon: <FolderMinus size={14} />, color: '#dc2626', bg: '#fee2e2' },
  'user.create':    { icon: <UserPlus size={14} />,    color: '#16a34a', bg: '#dcfce7' },
  'user.update':    { icon: <UserCog size={14} />,     color: '#d97706', bg: '#fef3c7' },
  'user.delete':    { icon: <UserMinus size={14} />,   color: '#dc2626', bg: '#fee2e2' },
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function ActivityPage() {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      setLogs(await fetchAuditLog())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Group logs by calendar date
  type Group = { dateLabel: string; entries: AuditLog[] }
  const groups: Group[] = []
  for (const entry of logs) {
    const dateLabel = new Date(entry.created_at).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const last = groups[groups.length - 1]
    if (last && last.dateLabel === dateLabel) {
      last.entries.push(entry)
    } else {
      groups.push({ dateLabel, entries: [entry] })
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{t('activity.title')}</h1>
          <p>{t('activity.subtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
          {t('activity.refresh')}
        </button>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="empty-state">{t('activity.loading')}</p>
        ) : logs.length === 0 ? (
          <p className="empty-state">{t('activity.empty')}</p>
        ) : (
          <div className="activity-feed">
            {groups.map((group) => (
              <div key={group.dateLabel} className="activity-group">
                <div className="activity-date-label">{group.dateLabel}</div>
                {group.entries.map((entry) => {
                  const meta = ACTION_META[entry.action] ?? { icon: <Pencil size={14} />, color: '#6b7280', bg: '#f3f4f6' }
                  const actionText = t(`activity.actions.${entry.action}`, {
                    entity: entry.entity_label,
                    context: entry.context_label ?? '',
                  })
                  const time = new Date(entry.created_at).toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit',
                  })

                  return (
                    <div key={entry.id} className="activity-row">
                      <div
                        className="activity-action-icon"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon}
                      </div>
                      <div className="avatar activity-avatar">{initials(entry.user_name)}</div>
                      <div className="activity-body">
                        <span className="activity-user">{entry.user_name}</span>
                        {' '}
                        <span className="activity-text">{actionText}</span>
                      </div>
                      <div className="activity-time">{time}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
