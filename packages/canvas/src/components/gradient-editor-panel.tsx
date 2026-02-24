import { useState, useRef, forwardRef } from 'react'
import type { GradientDef } from '../lib/gradient/gradient-types'
import { buildGradientCss } from '../lib/gradient/gradient-renderer'
import { addStop, removeStop, updateStopColor, updateStopPosition, reverseGradient } from '../lib/gradient/gradient-editor-utils'
import { PRESET_GRADIENTS } from '../lib/gradient/gradient-presets'
import { AdvancedColorPicker } from './advanced-color-picker'

interface GradientEditorPanelProps {
  gradient: GradientDef
  onChange: (def: GradientDef) => void
  onClose: () => void
}

export function GradientEditorPanel({ gradient, onChange, onClose }: GradientEditorPanelProps) {
  const [selectedStopIndex, setSelectedStopIndex] = useState(0)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const position = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const newColor = gradient.stops[selectedStopIndex]?.color ?? '#000000'
    onChange(addStop(gradient, newColor, position))
  }

  const handleStopDrag = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const startX = e.clientX
    const startPos = gradient.stops[index].position
    const rect = barRef.current.getBoundingClientRect()

    const handleMove = (moveE: MouseEvent) => {
      const delta = ((moveE.clientX - startX) / rect.width) * 100
      onChange(updateStopPosition(gradient, index, startPos + delta))
    }

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const selectedStop = gradient.stops[selectedStopIndex]

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Gradient Editor</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GradientBarWithRef
          ref={barRef}
          gradient={gradient}
          selectedIndex={selectedStopIndex}
          onClick={handleBarClick}
          onStopSelect={(i, e) => { e.stopPropagation(); setSelectedStopIndex(i); handleStopDrag(i, e as React.MouseEvent<HTMLDivElement>) }}
        />

        <TypeSelector gradient={gradient} onChange={onChange} />
        {gradient.type === 'linear' && <AngleSlider angle={gradient.angle} onChange={(angle) => onChange({ ...gradient, angle })} />}

        {selectedStop && (
          <StopColorEditor
            stop={selectedStop}
            canRemove={gradient.stops.length > 2}
            showPicker={showColorPicker}
            onTogglePicker={() => setShowColorPicker(!showColorPicker)}
            onColorChange={(color) => onChange(updateStopColor(gradient, selectedStopIndex, color))}
            onRemove={() => { onChange(removeStop(gradient, selectedStopIndex)); setSelectedStopIndex(Math.max(0, selectedStopIndex - 1)) }}
          />
        )}

        <button onClick={() => onChange(reverseGradient(gradient))} style={{ width: '100%', padding: '8px', fontSize: 12, borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>Reverse</button>
        <GradientPresetButtons onSelect={onChange} />
      </div>
    </div>
  )
}

const GradientBar = ({ gradient, selectedIndex, onClick, onStopSelect }: { gradient: GradientDef; selectedIndex: number; onClick: (e: React.MouseEvent<HTMLDivElement>) => void; onStopSelect: (i: number, e: React.MouseEvent) => void }, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Preview</div>
      <div ref={ref} onClick={onClick} style={{ height: 40, borderRadius: 6, background: buildGradientCss(gradient), position: 'relative', border: '1px solid #ddd', cursor: 'crosshair' }}>
        {gradient.stops.map((stop, i) => <GradientStopMarker key={i} stop={stop} selected={selectedIndex === i} onMouseDown={(e) => onStopSelect(i, e)} />)}
      </div>
      <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>Click to add stop, drag to move</div>
    </div>
  )
}
const GradientBarWithRef = forwardRef(GradientBar)

function GradientStopMarker({ stop, selected, onMouseDown }: { stop: { color: string; position: number }; selected: boolean; onMouseDown: (e: React.MouseEvent) => void }) {
  return <div onMouseDown={onMouseDown} style={{ position: 'absolute', left: `${stop.position}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: '50%', background: stop.color, border: selected ? '3px solid #333' : '2px solid #fff', cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
}

function TypeSelector({ gradient, onChange }: { gradient: GradientDef; onChange: (g: GradientDef) => void }) {
  const btnBase = { flex: 1, padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ddd', cursor: 'pointer', fontWeight: 500 }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => onChange({ ...gradient, type: 'linear' })} style={{ ...btnBase, background: gradient.type === 'linear' ? '#3b82f6' : '#fff', color: gradient.type === 'linear' ? '#fff' : '#333' }}>Linear</button>
      <button onClick={() => onChange({ ...gradient, type: 'radial' })} style={{ ...btnBase, background: gradient.type === 'radial' ? '#3b82f6' : '#fff', color: gradient.type === 'radial' ? '#fff' : '#333' }}>Radial</button>
    </div>
  )
}

function AngleSlider({ angle, onChange }: { angle: number; onChange: (angle: number) => void }) {
  return (
    <div>
      <label style={labelStyle}>Angle: {angle}°</label>
      <input type="range" min={0} max={360} value={angle} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
    </div>
  )
}

function StopColorEditor({ stop, canRemove, showPicker, onTogglePicker, onColorChange, onRemove }: { stop: { color: string }; canRemove: boolean; showPicker: boolean; onTogglePicker: () => void; onColorChange: (color: string) => void; onRemove: () => void }) {
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
      <label style={labelStyle}>Stop Color</label>
      {canRemove && <button onClick={onRemove} style={removeBtnStyle}>Remove</button>}
    </div>
    <button onClick={onTogglePicker} style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid #ddd', cursor: 'pointer', background: stop.color, padding: 0 }} />
    {showPicker && <div style={{ marginTop: 8, padding: 8, background: '#f9f9f9', borderRadius: 6 }}><AdvancedColorPicker value={stop.color} onChange={onColorChange} /></div>}
  </div>
}

function GradientPresetButtons({ onSelect }: { onSelect: (preset: GradientDef) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Presets</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {PRESET_GRADIENTS.map((preset, i) => (
          <button key={i} onClick={() => onSelect(preset)} style={{ width: 40, height: 40, borderRadius: 6, border: '1px solid #ddd', background: buildGradientCss(preset), cursor: 'pointer', padding: 0 }} />
        ))}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 400,
  width: 320,
  maxHeight: 'calc(100vh - 100px)',
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  border: '1px solid #e5e5e5',
  overflow: 'auto',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
  position: 'sticky',
  top: 0,
  background: '#fff',
  zIndex: 1,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '0 4px',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#666',
  display: 'block',
}

const removeBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 10,
  borderRadius: 4,
  border: '1px solid #ef4444',
  background: '#fff',
  color: '#ef4444',
  cursor: 'pointer',
  fontWeight: 500,
}
