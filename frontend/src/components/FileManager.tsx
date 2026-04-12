import { useEffect, useRef, useState } from 'react'
import { Paperclip, Trash2, Upload, X } from 'lucide-react'
import { ProjectFile } from '../types'
import { deleteFile, downloadUrl, fetchProjectFiles, uploadFile } from '../api/files'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  projectId: number
  projectCode: string
  onClose: () => void
  onFileCountChange: (id: number, delta: number) => void
}

export function FileManager({ projectId, projectCode, onClose, onFileCountChange }: Props) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProjectFiles(projectId).then(setFiles).catch(() => setFiles([]))
  }, [projectId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const record = await uploadFile(projectId, file)
      setFiles((prev) => [record, ...prev])
      onFileCountChange(projectId, 1)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(fileId: number) {
    try {
      await deleteFile(fileId)
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      onFileCountChange(projectId, -1)
    } catch {
      setError('Delete failed.')
    }
  }

  return (
    <div className="file-manager-overlay" onClick={onClose}>
      <div className="file-manager" onClick={(e) => e.stopPropagation()}>
        <div className="file-manager-head">
          <div>
            <h3>Files</h3>
            <p className="file-manager-sub">{projectCode}</p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="file-upload-zone" onClick={() => inputRef.current?.click()}>
          <Upload size={20} />
          <span>{uploading ? 'Uploading…' : 'Click to upload a file'}</span>
          <input ref={inputRef} type="file" hidden onChange={handleUpload} disabled={uploading} />
        </div>

        {error && <p className="upload-error">{error}</p>}

        {files.length === 0 ? (
          <p className="empty-state">No files yet.</p>
        ) : (
          <ul className="file-list">
            {files.map((f) => (
              <li key={f.id} className="file-item">
                <Paperclip size={14} className="file-icon" />
                <div className="file-info">
                  <a href={downloadUrl(f.id)} target="_blank" rel="noreferrer" className="file-name">
                    {f.original_name}
                  </a>
                  <span className="file-meta">{formatBytes(f.file_size)} · {formatDate(f.created_at)}</span>
                </div>
                <button className="icon-btn danger" onClick={() => handleDelete(f.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
