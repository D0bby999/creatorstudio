import { useEffect, useState } from 'react'

interface StyleCopyPasteIndicatorProps {
  message: string | null
}

export function StyleCopyPasteIndicator({ message }: StyleCopyPasteIndicatorProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [message])

  if (!visible || !message) return null

  return (
    <div style={toastStyle}>
      {message}
    </div>
  )
}

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 500,
  background: 'rgba(0, 0, 0, 0.85)',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  pointerEvents: 'none',
}
