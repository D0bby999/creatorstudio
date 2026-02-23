// Banner shown when user is following another user's viewport
// Provides Esc key to stop following

import { useEffect, useCallback } from 'react'

interface FollowingIndicatorProps {
  followingUserName: string | null
  followingUserColor?: string
  onStopFollowing: () => void
}

export function FollowingIndicator({
  followingUserName,
  followingUserColor = '#3b82f6',
  onStopFollowing,
}: FollowingIndicatorProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onStopFollowing()
    }
  }, [onStopFollowing])

  useEffect(() => {
    if (!followingUserName) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [followingUserName, handleKeyDown])

  if (!followingUserName) return null

  return (
    <div style={bannerStyle(followingUserColor)} role="status" aria-live="polite">
      <span style={{ fontSize: 12, fontWeight: 500 }}>
        Following <strong>{followingUserName}</strong>
      </span>
      <button
        onClick={onStopFollowing}
        style={stopBtnStyle}
        aria-label="Stop following"
      >
        Stop (Esc)
      </button>
    </div>
  )
}

function bannerStyle(color: string): React.CSSProperties {
  return {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 14px',
    borderRadius: 8,
    background: '#fff',
    color: '#1f2937',
    border: `2px solid ${color}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }
}

const stopBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 4,
  border: '1px solid #d1d5db',
  background: '#f3f4f6',
  color: '#374151',
  cursor: 'pointer',
}
