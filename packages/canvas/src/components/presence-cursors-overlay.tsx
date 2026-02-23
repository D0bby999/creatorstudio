/** Renders cursors for all connected collaborators */
import type { PresenceData } from '../lib/canvas-presence-utils'
import { formatUserName } from '../lib/canvas-presence-utils'

interface PresenceCursorsOverlayProps {
  users: Map<string, PresenceData>
}

export function PresenceCursorsOverlay({ users }: PresenceCursorsOverlayProps) {
  const entries = Array.from(users.values()).filter(u => u.cursor !== null)
  if (entries.length === 0) return null

  return (
    <div style={overlayStyle}>
      {entries.map(user => (
        <PresenceCursor key={user.userId} user={user} />
      ))}
    </div>
  )
}

function PresenceCursor({ user }: { user: PresenceData }) {
  if (!user.cursor) return null

  return (
    <div
      style={{
        position: 'absolute',
        left: user.cursor.x,
        top: user.cursor.y,
        pointerEvents: 'none',
        transition: 'left 80ms linear, top 80ms linear',
        zIndex: 999,
      }}
    >
      {/* SVG cursor arrow */}
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" style={{ display: 'block' }}>
        <path
          d="M0.5 0.5L15 10.5L7.5 11.5L4.5 19.5L0.5 0.5Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      {/* Name label */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          top: 14,
          background: user.color,
          color: '#fff',
          fontSize: 10,
          fontWeight: 500,
          padding: '2px 6px',
          borderRadius: 4,
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {formatUserName(user.userName)}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  zIndex: 400,
}
