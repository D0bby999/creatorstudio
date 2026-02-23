import { useState, useEffect, useCallback } from 'react'
import type { Editor } from 'tldraw'
import { getVersions, saveVersion, restoreVersion, deleteVersion, type VersionEntry } from '../lib/canvas-version-history'

interface VersionHistoryPanelProps {
  editor: Editor
  projectId: string
  onClose: () => void
}

export function VersionHistoryPanel({ editor, projectId, onClose }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Omit<VersionEntry, 'snapshot'>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getVersions(projectId)
      setVersions(list)
    } catch { /* empty */ }
    setLoading(false)
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  const handleSaveVersion = async () => {
    setSaving(true)
    try {
      const snapshot = editor.store.getStoreSnapshot()
      await saveVersion(projectId, snapshot, `Manual save`)
      await refresh()
    } catch { /* empty */ }
    setSaving(false)
  }

  const handleRestore = async (timestamp: number) => {
    const ok = window.confirm('Restore this version? Current unsaved changes will be lost.')
    if (!ok) return
    await restoreVersion(editor, projectId, timestamp)
  }

  const handleDelete = async (timestamp: number) => {
    await deleteVersion(projectId, timestamp)
    await refresh()
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>History</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <button onClick={handleSaveVersion} disabled={saving} style={saveBtnStyle}>
          {saving ? 'Saving...' : 'Save Version'}
        </button>
      </div>

      <div style={{ overflow: 'auto', maxHeight: 360, padding: '0 12px 12px' }}>
        {loading && <div style={emptyStyle}>Loading...</div>}
        {!loading && versions.length === 0 && <div style={emptyStyle}>No versions saved yet</div>}

        {versions.map((v, i) => (
          <div key={v.timestamp} style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                {v.label || formatDate(v.timestamp)}
                {i === 0 && <span style={{ marginLeft: 6, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>Latest</span>}
              </div>
              <div style={{ fontSize: 10, color: '#999' }}>
                {v.shapeCount} records · {formatDate(v.timestamp)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => handleRestore(v.timestamp)} style={actionBtnStyle}>Restore</button>
              <button onClick={() => handleDelete(v.timestamp)} style={{ ...actionBtnStyle, color: '#ef4444' }}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  zIndex: 300,
  width: 260,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  border: '1px solid #e5e5e5',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '0 4px',
}

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
  textAlign: 'center',
  padding: '24px 0',
}

const saveBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: '1px solid #ddd',
  background: '#fafafa',
  cursor: 'pointer',
  color: '#333',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 0',
  borderBottom: '1px solid #f5f5f5',
}

const actionBtnStyle: React.CSSProperties = {
  padding: '3px 8px',
  fontSize: 11,
  borderRadius: 4,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  color: '#555',
}
