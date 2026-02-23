/** Panel showing online collaborators in current room */
import type { PresenceData } from '../lib/canvas-presence-utils'
import { formatUserName } from '../lib/canvas-presence-utils'

interface UserListPanelProps {
  users: Map<string, PresenceData>
  currentUserId: string
  currentUserName: string
}

export function UserListPanel({ users, currentUserId, currentUserName }: UserListPanelProps) {
  const allUsers = [
    { userId: currentUserId, userName: currentUserName, color: '#666', isSelf: true },
    ...Array.from(users.values()).map(u => ({ ...u, isSelf: false })),
  ]

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>
        Online ({allUsers.length})
      </div>
      {allUsers.map(user => (
        <div key={user.userId} style={userRowStyle}>
          <div style={{ ...avatarStyle, background: user.color }}>
            {user.userName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 12, color: '#333', flex: 1 }}>
            {formatUserName(user.userName)}
          </span>
          {user.isSelf && (
            <span style={{ fontSize: 10, color: '#999' }}>You</span>
          )}
        </div>
      ))}
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 301,
  background: '#fff',
  borderRadius: 8,
  padding: '8px 10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
  border: '1px solid #e5e5e5',
  minWidth: 140,
}

const userRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 0',
}

const avatarStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 10,
  fontWeight: 600,
  flexShrink: 0,
}
