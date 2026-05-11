import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Folder, FolderPlus, File, Trash2, Upload, X, Check, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts'
import { api } from '../api/client'
import { fetchProjectFiles, uploadFile, deleteFile, downloadUrl } from '../api/files'
import { fetchFolders, createFolder, deleteFolder } from '../api/folders'
import { Project, ProjectFile, ProjectFolder } from '../types'
import { ProjectFormModal } from '../components/ProjectFormModal'

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

const progressColor = (v: number) => v >= 80 ? '#20bf6b' : v >= 40 ? '#3867d6' : '#f0932b'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [folders, setFolders] = useState<ProjectFolder[]>([])
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [currentFolder, setCurrentFolder] = useState<ProjectFolder | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Inline new-folder form
  const [newFolderMode, setNewFolderMode] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderSaving, setFolderSaving] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)

  const projectId = Number(id)
  const isAdmin = user?.role === 'admin'
  const isClient = user?.role === 'client'
  const isLead = project?.responsible_id === user?.id
  const canManageProject = !isClient && (isAdmin || isLead)
  const canManageFiles = !isClient

  async function load() {
    setLoading(true)
    try {
      const [proj, foldList, fileList] = await Promise.all([
        api.get<Project>(`/projects/${projectId}`).then((r) => r.data),
        fetchFolders(projectId),
        fetchProjectFiles(projectId),
      ])
      setProject(proj)
      setFolders(foldList)
      setFiles(fileList)
    } catch {
      setError('Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [projectId])

  // Files shown in current view
  const visibleFiles = files.filter((f) =>
    currentFolder ? f.folder_id === currentFolder.id : f.folder_id == null
  )

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const record = await uploadFile(projectId, file, currentFolder?.id ?? null)
      setFiles((prev) => [record, ...prev])
    } catch {
      setError(t('fileManager.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteFile(f: ProjectFile) {
    setError(null)
    try {
      await deleteFile(f.id)
      setFiles((prev) => prev.filter((x) => x.id !== f.id))
    } catch (err: any) {
      setError(err?.response?.status === 403 ? t('fileManager.errorForbidden') : t('fileManager.errorDelete'))
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setFolderSaving(true)
    setFolderError(null)
    try {
      const folder = await createFolder(projectId, newFolderName.trim())
      setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)))
      setNewFolderName('')
      setNewFolderMode(false)
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setFolderError(typeof detail === 'string' ? detail : t('detail.folderError'))
    } finally {
      setFolderSaving(false)
    }
  }

  async function handleDeleteFolder(folder: ProjectFolder) {
    const fileCount = files.filter((f) => f.folder_id === folder.id).length
    if (fileCount > 0) {
      setError(t('detail.folderNotEmpty', { count: fileCount }))
      return
    }
    if (!confirm(t('detail.confirmDeleteFolder', { name: folder.name }))) return
    try {
      await deleteFolder(projectId, folder.id)
      setFolders((prev) => prev.filter((x) => x.id !== folder.id))
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('fileManager.errorDelete'))
    }
  }

  if (loading) return <div className="page"><p className="empty-state">{t('detail.loading')}</p></div>
  if (!project) return <div className="page"><p className="empty-state">{t('detail.notFound')}</p></div>

  const STATUS_LABEL: Record<string, string> = {
    active: t('projects.statusActive'),
    completed: t('projects.statusCompleted'),
    draft: t('projects.statusDraft'),
  }

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="detail-header">
        <button className="detail-back" onClick={() => navigate('/projects')}>
          <ArrowLeft size={16} /> {t('nav.projects')}
        </button>

        <div className="detail-title-row">
          <div>
            <div className="detail-meta-row">
              <code className="code-cell">{project.code}</code>
              <span className={`status-chip ${project.status}`}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
              <span className="region-badge">{project.region}</span>
              {project.responsible_name && (
                <span className="detail-lead">
                  {t('projects.colLead')}: <strong>{project.responsible_name}</strong>
                </span>
              )}
            </div>
            <h1 className="detail-title">{project.title}</h1>
            <div className="detail-type">{project.type}</div>
          </div>
          <div className="detail-progress-block">
            <div className="detail-progress-label">{project.progress}%</div>
            <div className="progress-track" style={{ width: 120 }}>
              <div className="progress-bar" style={{ width: `${project.progress}%`, background: progressColor(project.progress) }} />
            </div>
            {canManageProject && (
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => setEditOpen(true)}>
                {t('projectForm.titleEdit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── File manager ── */}
      <div className="table-card">
        {/* Toolbar */}
        <div className="detail-toolbar">
          <div className="detail-breadcrumb">
            <button
              className={`crumb-btn${!currentFolder ? ' crumb-active' : ''}`}
              onClick={() => setCurrentFolder(null)}
            >
              {t('detail.root')}
            </button>
            {currentFolder && (
              <>
                <ChevronRight size={14} className="crumb-sep" />
                <span className="crumb-btn crumb-active">{currentFolder.name}</span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {canManageFiles && !currentFolder && (
              <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => { setNewFolderMode(true); setFolderError(null) }}>
                <FolderPlus size={14} /> {t('detail.newFolder')}
              </button>
            )}
            {canManageFiles && (
              <>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: 13 }}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> {uploading ? t('fileManager.uploading') : t('detail.upload')}
                </button>
                <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="detail-error">
            {error}
            <button className="icon-btn" onClick={() => setError(null)} style={{ marginLeft: 8 }}><X size={14} /></button>
          </div>
        )}

        {/* New folder inline form */}
        {canManageFiles && newFolderMode && (
          <form className="new-folder-row" onSubmit={handleCreateFolder}>
            <Folder size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => { setNewFolderName(e.target.value); setFolderError(null) }}
              placeholder={t('detail.folderNamePlaceholder')}
              maxLength={255}
              className="new-folder-input"
            />
            {folderError && <span className="upload-error" style={{ fontSize: 12 }}>{folderError}</span>}
            <button type="submit" className="icon-btn" title={t('detail.save')} disabled={folderSaving}>
              <Check size={16} style={{ color: '#16a34a' }} />
            </button>
            <button type="button" className="icon-btn" title={t('projectForm.cancel')} onClick={() => { setNewFolderMode(false); setNewFolderName('') }}>
              <X size={16} />
            </button>
          </form>
        )}

        {/* Folders (only at root) */}
        {!currentFolder && folders.map((folder) => {
          const count = files.filter((f) => f.folder_id === folder.id).length
          return (
            <div
              key={folder.id}
              className="fm-row fm-folder-row"
              onClick={() => setCurrentFolder(folder)}
            >
              <Folder size={16} className="fm-icon fm-icon-folder" />
              <span className="fm-name">{folder.name}</span>
              <span className="fm-meta">{t('detail.fileCount', { count })}</span>
              <span className="fm-date">{new Date(folder.created_at).toLocaleDateString()}</span>
              {canManageProject && (
                <button
                  className="icon-btn icon-btn-danger"
                  title={t('detail.deleteFolder')}
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder) }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}

        {/* Files */}
        {visibleFiles.length === 0 && !newFolderMode ? (
          <p className="empty-state">{t('detail.noFiles')}</p>
        ) : (
          visibleFiles.map((f) => (
            <div key={f.id} className="fm-row fm-file-row">
              <File size={16} className="fm-icon fm-icon-file" />
              <a
                href={downloadUrl(f.id)}
                target="_blank"
                rel="noreferrer"
                className="fm-name fm-file-link"
                onClick={(e) => e.stopPropagation()}
              >
                {f.original_name}
              </a>
              <span className="fm-meta">{formatBytes(f.file_size)}</span>
              <span className="fm-date">{new Date(f.created_at).toLocaleDateString()}</span>
              <a href={downloadUrl(f.id)} download className="icon-btn" title={t('detail.download')}>
                <Download size={14} />
              </a>
              {canManageFiles && (
                <button
                  className="icon-btn icon-btn-danger"
                  title={t('admin.tipDelete')}
                  onClick={() => handleDeleteFile(f)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {editOpen && project && (
        <ProjectFormModal
          project={project}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => { setProject(updated); setEditOpen(false) }}
        />
      )}
    </div>
  )
}
