import { useState, useEffect, useRef } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import { getShapeTransform, setShapeTransform, flipShape, lockAspect } from '../lib/transform/transform-sync'

interface TransformPanelProps {
  editor: Editor
  onClose: () => void
}

export function TransformPanel({ editor, onClose }: TransformPanelProps) {
  const [selectedShapeId, setSelectedShapeId] = useState<TLShapeId | null>(null)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [w, setW] = useState(0)
  const [h, setH] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [aspectLocked, setAspectLocked] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Subscribe to selection changes and update inputs
  useEffect(() => {
    const update = () => {
      const shapes = editor.getSelectedShapes()
      if (shapes.length === 1) {
        const transform = getShapeTransform(editor, shapes[0].id)
        if (transform) {
          setSelectedShapeId(shapes[0].id)
          setX(transform.x)
          setY(transform.y)
          setW(transform.w)
          setH(transform.h)
          setRotation(transform.rotation)
          return
        }
      }
      setSelectedShapeId(null)
    }
    update()
    const unsub = editor.store.listen(update, { scope: 'document' })
    return () => unsub()
  }, [editor])

  // Debounced update to shape
  const updateShape = (partial: Partial<{ x: number; y: number; w: number; h: number; rotation: number }>) => {
    if (!selectedShapeId) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setShapeTransform(editor, selectedShapeId, partial)
    }, 50)
  }

  const handleXChange = (value: number) => {
    setX(value)
    updateShape({ x: value })
  }

  const handleYChange = (value: number) => {
    setY(value)
    updateShape({ y: value })
  }

  const handleWChange = (value: number) => {
    if (aspectLocked) {
      const locked = lockAspect(w, h, 'w', value)
      setW(locked.w)
      setH(locked.h)
      updateShape({ w: locked.w, h: locked.h })
    } else {
      setW(value)
      updateShape({ w: value })
    }
  }

  const handleHChange = (value: number) => {
    if (aspectLocked) {
      const locked = lockAspect(w, h, 'h', value)
      setW(locked.w)
      setH(locked.h)
      updateShape({ w: locked.w, h: locked.h })
    } else {
      setH(value)
      updateShape({ h: value })
    }
  }

  const handleRotationChange = (value: number) => {
    // Normalize to 0-360
    let normalized = value % 360
    if (normalized < 0) normalized += 360
    setRotation(normalized)
    updateShape({ rotation: normalized })
  }

  const handleFlipH = () => {
    if (!selectedShapeId) return
    flipShape(editor, [selectedShapeId], 'horizontal')
  }

  const handleFlipV = () => {
    if (!selectedShapeId) return
    flipShape(editor, [selectedShapeId], 'vertical')
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Transform</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>
      <div style={{ padding: '8px 12px' }}>
        {!selectedShapeId ? (
          <div style={emptyStyle}>Select a shape to transform</div>
        ) : (
          <>
            {/* Position */}
            <SectionLabel>Position</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <NumberInput label="X" value={x} onChange={handleXChange} step={1} />
              <NumberInput label="Y" value={y} onChange={handleYChange} step={1} />
            </div>

            {/* Size with aspect lock */}
            <SectionLabel>Size</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 12, alignItems: 'end' }}>
              <NumberInput label="W" value={w} onChange={handleWChange} step={1} min={1} />
              <button
                onClick={() => setAspectLocked(!aspectLocked)}
                style={{
                  ...lockButtonStyle,
                  color: aspectLocked ? '#3b82f6' : '#999',
                  borderColor: aspectLocked ? '#3b82f6' : '#ddd',
                }}
                title={aspectLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              >
                {aspectLocked ? '🔗' : '⛓️‍💥'}
              </button>
              <NumberInput label="H" value={h} onChange={handleHChange} step={1} min={1} />
            </div>

            {/* Rotation */}
            <SectionLabel>Rotation</SectionLabel>
            <NumberInput
              label="Degrees"
              value={rotation}
              onChange={handleRotationChange}
              step={1}
              min={0}
              max={360}
            />

            {/* Flip buttons */}
            <SectionLabel>Flip</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              <button onClick={handleFlipH} style={flipButtonStyle}>
                ↔️ Horizontal
              </button>
              <button onClick={handleFlipV} style={flipButtonStyle}>
                ↕️ Vertical
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
      {children}
    </div>
  )
}

interface NumberInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}

function NumberInput({ label, value, onChange, step = 1, min, max }: NumberInputProps) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 280,
  zIndex: 300,
  width: 240,
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

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#666',
  marginBottom: 4,
  display: 'block',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 5,
  outline: 'none',
  fontFamily: 'inherit',
}

const lockButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  padding: 0,
  border: '1px solid #ddd',
  borderRadius: 5,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 0,
}

const flipButtonStyle: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: 11,
  fontWeight: 500,
  border: '1px solid #ddd',
  borderRadius: 5,
  background: '#fff',
  cursor: 'pointer',
  color: '#555',
}
