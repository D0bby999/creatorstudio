import { useState, useEffect, useRef } from 'react'
import { getFontsByCategory, loadFont, type FontInfo } from '../lib/canvas-font-loader'

interface FontPickerWidgetProps {
  value: string
  onChange: (family: string) => void
}

export function FontPickerWidget({ value, onChange }: FontPickerWidgetProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)
  const grouped = getFontsByCategory()

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

  const handleSelect = (font: FontInfo) => {
    loadFont(font.family, 400)
    onChange(font.family)
    setOpen(false)
    setSearch('')
  }

  const filterFonts = (fonts: FontInfo[]) => {
    if (!search) return fonts
    const q = search.toLowerCase()
    return fonts.filter((f) => f.family.toLowerCase().includes(q))
  }

  const categoryLabels: Record<string, string> = {
    sans: 'Sans Serif',
    serif: 'Serif',
    display: 'Display',
    mono: 'Monospace',
    system: 'System',
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={triggerStyle}>
        <span style={{ fontFamily: value, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
        <span style={{ fontSize: 10, color: '#999' }}>▾</span>
      </button>

      {open && (
        <div ref={popupRef} style={popupStyle}>
          <div style={{ padding: 6 }}>
            <input
              type="text"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={searchStyle}
            />
          </div>
          <div style={{ overflow: 'auto', maxHeight: 280 }}>
            {Object.entries(grouped).map(([cat, fonts]) => {
              const filtered = filterFonts(fonts)
              if (filtered.length === 0) return null
              return (
                <div key={cat}>
                  <div style={catLabelStyle}>{categoryLabels[cat] ?? cat}</div>
                  {filtered.map((font) => (
                    <FontRow
                      key={font.family}
                      font={font}
                      active={value === font.family}
                      onClick={() => handleSelect(font)}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function FontRow({ font, active, onClick }: { font: FontInfo; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.1 },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (visible && font.category !== 'system') {
      loadFont(font.family, 400)
    }
  }, [visible, font])

  return (
    <button ref={ref} onClick={onClick} style={{ ...rowStyle, background: active ? '#e8f0fe' : 'transparent' }}>
      <span style={{ fontFamily: visible ? font.family : 'inherit', fontSize: 13 }}>
        {font.family}
      </span>
    </button>
  )
}

const triggerStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 5,
  background: '#fff',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 4,
}

const popupStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 400,
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  border: '1px solid #e5e5e5',
  marginTop: 2,
}

const searchStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 5,
  outline: 'none',
}

const catLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  padding: '6px 10px 2px',
}

const rowStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '5px 10px',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}
