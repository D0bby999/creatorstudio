/** Top toolbar for the canvas editor — panels, save status, collaboration controls */
import type { SaveStatus } from '../lib/canvas-auto-save'
import type { ConnectionStatus } from '../lib/canvas-presence-utils'
import { CollaborationModeToggle } from './collaboration-mode-toggle'
import { ConnectionStatusBadge } from './connection-status-badge'

interface CanvasToolbarProps {
  panels: { key: string; label: string; active: boolean; toggle: () => void; condition?: boolean }[]
  saveStatus: SaveStatus
  collabAvailable: boolean
  collabEnabled: boolean
  collabStatus: ConnectionStatus
  collabLatencyMs: number
  onMultiplayerChange: (v: boolean) => void
}

const statusColors: Record<SaveStatus, string> = {
  idle: '#ccc', unsaved: '#eab308', saving: '#3b82f6', saved: '#22c55e', error: '#ef4444',
}
const statusLabels: Record<SaveStatus, string> = {
  idle: '', unsaved: 'Unsaved', saving: 'Saving...', saved: 'Saved', error: 'Save failed',
}

export function CanvasToolbar({
  panels, saveStatus, collabAvailable, collabEnabled, collabStatus, collabLatencyMs, onMultiplayerChange,
}: CanvasToolbarProps) {
  return (
    <div style={toolbarContainerStyle}>
      {panels.filter(p => p.condition !== false).map(p =>
        p.key === 'sep'
          ? <div key={p.key} style={toolbarSeparator} />
          : <button key={p.key} onClick={p.toggle} style={toolbarBtnStyle(p.active)}>{p.label}</button>
      )}

      {saveStatus !== 'idle' && (
        <>
          <div style={toolbarSeparator} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[saveStatus] }} />
            <span style={{ fontSize: 11, color: '#888' }}>{statusLabels[saveStatus]}</span>
          </div>
        </>
      )}
      {collabAvailable && (
        <>
          <div style={toolbarSeparator} />
          <CollaborationModeToggle onModeChange={onMultiplayerChange} />
          {collabEnabled && <ConnectionStatusBadge status={collabStatus} latencyMs={collabLatencyMs} />}
        </>
      )}
    </div>
  )
}

const toolbarContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  display: 'flex',
  gap: 4,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: '4px 8px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  border: '1px solid var(--color-border, #e5e5e5)',
}

const toolbarSeparator: React.CSSProperties = {
  width: 1,
  background: '#e0e0e0',
  margin: '2px 4px',
}

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#e8e8e8' : 'transparent',
    color: '#333',
  }
}
