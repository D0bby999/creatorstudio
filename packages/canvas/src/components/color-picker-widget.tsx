import { useState, useEffect, useRef } from 'react'
import { AdvancedColorPicker } from './advanced-color-picker'

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
  const popupRef = useRef<HTMLDivElement>(null)

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
          <div style={{ padding: '8px' }}>
            <AdvancedColorPicker value={value} onChange={onChange} />
            {showOpacity && onOpacityChange && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 12 }}>
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
          </div>
        </div>
      )}
    </div>
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
  width: 240,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  border: '1px solid #e5e5e5',
  marginTop: 4,
  overflow: 'hidden',
}
