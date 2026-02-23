import { useState, useEffect, useRef, useCallback } from 'react'

const PRESET_SWATCHES = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9', '#14b8a6',
]
const RECENT_KEY = 'canvas-recent-colors'
const MAX_RECENT = 8

interface ColorPickerWidgetProps {
  value: string
  onChange: (color: string) => void
  label?: string
  showOpacity?: boolean
  opacity?: number
  onOpacityChange?: (opacity: number) => void
}

export function ColorPickerWidget({ value, onChange, label, showOpacity, opacity = 1, onOpacityChange }: ColorPickerWidgetProps) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [hexInput, setHexInput] = useState(value)
  const popupRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch { /* empty */ }
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const addToRecent = useCallback((color: string) => {
    setRecent((prev) => {
      const next = [color, ...prev.filter((c) => c !== color)].slice(0, MAX_RECENT)
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* empty */ }
      return next
    })
  }, [])

  const handleColorChange = useCallback((color: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(color)
      addToRecent(color)
    }, 100)
  }, [onChange, addToRecent])

  const handleHexSubmit = () => {
    if (/^#[0-9a-fA-F]{3,8}$/.test(hexInput)) {
      onChange(hexInput)
      addToRecent(hexInput)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {label && <label style={labelStyle}>{label}</label>}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: '2px solid #ddd',
          cursor: 'pointer',
          background: value,
          padding: 0,
        }}
      />
      {open && (
        <div ref={popupRef} style={popupStyle}>
          <input
            type="color"
            value={value}
            onChange={(e) => { setHexInput(e.target.value); handleColorChange(e.target.value) }}
            style={{ width: '100%', height: 100, border: 'none', cursor: 'pointer', padding: 0 }}
          />
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                onBlur={handleHexSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit() }}
                style={{ flex: 1, padding: '4px 6px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, fontFamily: 'monospace' }}
              />
            </div>

            {showOpacity && onOpacityChange && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#888', width: 40 }}>Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => onOpacityChange(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 10, color: '#666', width: 28, textAlign: 'right' }}>
                  {Math.round(opacity * 100)}%
                </span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Presets</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {PRESET_SWATCHES.map((c) => (
                  <SwatchBtn key={c} color={c} active={value === c} onClick={() => { setHexInput(c); handleColorChange(c) }} />
                ))}
              </div>
            </div>

            {recent.length > 0 && (
              <div>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Recent</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {recent.map((c) => (
                    <SwatchBtn key={c} color={c} active={value === c} onClick={() => { setHexInput(c); handleColorChange(c) }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SwatchBtn({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        border: active ? '2px solid #333' : '1px solid #ddd',
        background: color,
        cursor: 'pointer',
        padding: 0,
      }}
    />
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#666',
  marginBottom: 4,
  display: 'block',
}

const popupStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  zIndex: 400,
  width: 200,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  border: '1px solid #e5e5e5',
  marginTop: 4,
  overflow: 'hidden',
}
