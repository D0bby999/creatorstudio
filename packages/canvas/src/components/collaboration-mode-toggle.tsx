/** Toggle between solo and multiplayer collaboration modes */
import { useState, useEffect } from 'react'

interface CollaborationModeToggleProps {
  onModeChange: (multiplayer: boolean) => void
  initialMode?: boolean
}

const STORAGE_KEY = 'canvas-collab-mode'

export function CollaborationModeToggle({ onModeChange, initialMode }: CollaborationModeToggleProps) {
  const [multiplayer, setMultiplayer] = useState(() => {
    if (initialMode !== undefined) return initialMode
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(multiplayer)) } catch { /* noop */ }
    onModeChange(multiplayer)
  }, [multiplayer, onModeChange])

  return (
    <button
      onClick={() => setMultiplayer(v => !v)}
      style={{
        ...btnStyle,
        background: multiplayer ? '#3b82f6' : '#f3f4f6',
        color: multiplayer ? '#fff' : '#666',
      }}
      title={multiplayer ? 'Switch to solo mode' : 'Switch to multiplayer mode'}
    >
      {multiplayer ? 'Multiplayer' : 'Solo'}
    </button>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 6,
  border: '1px solid #e5e5e5',
  cursor: 'pointer',
  transition: 'background 150ms, color 150ms',
}
