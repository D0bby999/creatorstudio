import { useState, useEffect } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import type { TextEffectsMeta } from '../lib/text-effects/text-effect-types'
import { DEFAULT_TEXT_SHADOW, DEFAULT_TEXT_OUTLINE, DEFAULT_TEXT_GLOW, DEFAULT_TEXT_CURVE } from '../lib/text-effects/text-effect-types'

interface TextEffectsPanelProps {
  editor: Editor
  shapeId: string
  onClose: () => void
}

export function TextEffectsPanel({ editor, shapeId, onClose }: TextEffectsPanelProps) {
  const [effects, setEffects] = useState<TextEffectsMeta>({})

  useEffect(() => {
    const shape = editor.getShape(shapeId as TLShapeId)
    if (shape?.meta?.textEffects) {
      setEffects(shape.meta.textEffects as TextEffectsMeta)
    }
  }, [editor, shapeId])

  const updateEffects = (newEffects: TextEffectsMeta) => {
    setEffects(newEffects)
    editor.updateShapes([{
      id: shapeId as TLShapeId,
      type: 'enhanced-text',
      meta: { textEffects: newEffects } as any,
    }])
  }

  const resetAll = () => {
    updateEffects({})
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Text Effects</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>
      <div style={scrollStyle}>
        <ShadowSection effects={effects} onChange={updateEffects} />
        <OutlineSection effects={effects} onChange={updateEffects} />
        <GlowSection effects={effects} onChange={updateEffects} />
        <CurveSection effects={effects} onChange={updateEffects} />

        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
          <button onClick={resetAll} style={resetBtnStyle}>
            Reset All Effects
          </button>
        </div>
      </div>
    </div>
  )
}

function ShadowSection({ effects, onChange }: { effects: TextEffectsMeta; onChange: (e: TextEffectsMeta) => void }) {
  const enabled = !!effects.shadow
  const shadow = effects.shadow ?? DEFAULT_TEXT_SHADOW

  const toggle = () => {
    if (enabled) {
      const { shadow: _, ...rest } = effects
      onChange(rest)
    } else {
      onChange({ ...effects, shadow: DEFAULT_TEXT_SHADOW })
    }
  }

  const update = (key: keyof typeof shadow, value: number | string) => {
    onChange({ ...effects, shadow: { ...shadow, [key]: value } })
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span style={{ fontWeight: 600, fontSize: 12 }}>Shadow</span>
      </div>
      {enabled && (
        <>
          <NumberInput label="Offset X" value={shadow.offsetX} onChange={(v) => update('offsetX', v)} min={-20} max={20} />
          <NumberInput label="Offset Y" value={shadow.offsetY} onChange={(v) => update('offsetY', v)} min={-20} max={20} />
          <NumberInput label="Blur" value={shadow.blur} onChange={(v) => update('blur', v)} min={0} max={30} />
          <ColorInput label="Color" value={shadow.color} onChange={(v) => update('color', v)} />
        </>
      )}
    </div>
  )
}

function OutlineSection({ effects, onChange }: { effects: TextEffectsMeta; onChange: (e: TextEffectsMeta) => void }) {
  const enabled = !!effects.outline
  const outline = effects.outline ?? DEFAULT_TEXT_OUTLINE

  const toggle = () => {
    if (enabled) {
      const { outline: _, ...rest } = effects
      onChange(rest)
    } else {
      onChange({ ...effects, outline: DEFAULT_TEXT_OUTLINE })
    }
  }

  const update = (key: keyof typeof outline, value: number | string) => {
    onChange({ ...effects, outline: { ...outline, [key]: value } })
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span style={{ fontWeight: 600, fontSize: 12 }}>Outline</span>
      </div>
      {enabled && (
        <>
          <NumberInput label="Width" value={outline.width} onChange={(v) => update('width', v)} min={0} max={10} step={0.5} />
          <ColorInput label="Color" value={outline.color} onChange={(v) => update('color', v)} />
        </>
      )}
    </div>
  )
}

function GlowSection({ effects, onChange }: { effects: TextEffectsMeta; onChange: (e: TextEffectsMeta) => void }) {
  const enabled = !!effects.glow
  const glow = effects.glow ?? DEFAULT_TEXT_GLOW

  const toggle = () => {
    if (enabled) {
      const { glow: _, ...rest } = effects
      onChange(rest)
    } else {
      onChange({ ...effects, glow: DEFAULT_TEXT_GLOW })
    }
  }

  const update = (key: keyof typeof glow, value: number | string) => {
    onChange({ ...effects, glow: { ...glow, [key]: value } })
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span style={{ fontWeight: 600, fontSize: 12 }}>Glow</span>
      </div>
      {enabled && (
        <>
          <ColorInput label="Color" value={glow.color} onChange={(v) => update('color', v)} />
          <NumberInput label="Intensity" value={glow.intensity} onChange={(v) => update('intensity', v)} min={1} max={10} />
          <NumberInput label="Spread" value={glow.spread} onChange={(v) => update('spread', v)} min={1} max={5} step={0.5} />
        </>
      )}
    </div>
  )
}

function CurveSection({ effects, onChange }: { effects: TextEffectsMeta; onChange: (e: TextEffectsMeta) => void }) {
  const enabled = !!effects.curve
  const curve = effects.curve ?? DEFAULT_TEXT_CURVE

  const toggle = () => {
    if (enabled) {
      const { curve: _, ...rest } = effects
      onChange(rest)
    } else {
      onChange({ ...effects, curve: DEFAULT_TEXT_CURVE })
    }
  }

  const update = (key: keyof typeof curve, value: string | number) => {
    onChange({ ...effects, curve: { ...curve, [key]: value } })
  }

  return (
    <div style={sectionStyle}>
      <div style={sectionHeaderStyle}>
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span style={{ fontWeight: 600, fontSize: 12 }}>Curve</span>
      </div>
      {enabled && (
        <>
          <SelectInput label="Mode" value={curve.mode} options={['arc', 'wave', 'circle']} onChange={(v) => update('mode', v)} />
          <NumberInput label="Radius" value={curve.radius} onChange={(v) => update('radius', v)} min={50} max={500} step={10} />
        </>
      )}
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} style={inputStyle} />
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 28, height: 28, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
      </div>
    </div>
  )
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

const panelStyle: React.CSSProperties = { position: 'absolute', top: 8, left: 8, zIndex: 300, width: 260, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid #e5e5e5' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #eee' }
const closeBtnStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999', padding: '0 4px' }
const scrollStyle: React.CSSProperties = { overflow: 'auto', maxHeight: 'calc(100vh - 200px)', padding: '8px 12px' }
const sectionStyle: React.CSSProperties = { marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }
const sectionHeaderStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }
const fieldStyle: React.CSSProperties = { marginBottom: 8 }
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: '#666', marginBottom: 4, display: 'block' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e5e5e5', borderRadius: 5, outline: 'none', fontFamily: 'inherit' }
const resetBtnStyle: React.CSSProperties = { width: '100%', padding: '8px', fontSize: 12, fontWeight: 600, color: '#e11d48', background: '#fff', border: '1px solid #e11d48', borderRadius: 6, cursor: 'pointer' }
