import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor, TLShape } from 'tldraw'
import { STYLE_PRESETS, applyStylePreset } from '../lib/shape-style-presets'

interface PropertyInspectorPanelProps {
  editor: Editor
  onClose: () => void
}

export function PropertyInspectorPanel({ editor, onClose }: PropertyInspectorPanelProps) {
  const [selectedShape, setSelectedShape] = useState<TLShape | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const update = () => {
      const shapes = editor.getSelectedShapes()
      setSelectedShape(shapes.length === 1 ? shapes[0] : null)
    }
    update()
    const unsub = editor.store.listen(update, { scope: 'document' })
    return () => unsub()
  }, [editor])

  const updateProp = useCallback((key: string, value: string | number) => {
    if (!selectedShape) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      editor.updateShapes([{
        id: selectedShape.id,
        type: selectedShape.type,
        props: { [key]: value },
      }])
    }, 50)
  }, [editor, selectedShape])

  const updatePropDebounced = useCallback((key: string, value: string | number) => {
    if (!selectedShape) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      editor.updateShapes([{
        id: selectedShape.id,
        type: selectedShape.type,
        props: { [key]: value },
      }])
    }, 300)
  }, [editor, selectedShape])

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Inspector</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)', padding: '8px 12px' }}>
        {!selectedShape ? (
          <div style={emptyStyle}>Select a shape to edit its properties</div>
        ) : (
          <>
            <ShapeProps shape={selectedShape} onChange={updateProp} onChangeDebounced={updatePropDebounced} />
            <PresetSelector editor={editor} />
          </>
        )}
      </div>
    </div>
  )
}

interface ShapePropsProps {
  shape: TLShape
  onChange: (key: string, value: string | number) => void
  onChangeDebounced: (key: string, value: string | number) => void
}

function ShapeProps({ shape, onChange, onChangeDebounced }: ShapePropsProps) {
  const props = shape.props as Record<string, any>
  const type = shape.type

  switch (type as string) {
    case 'social-card':
      return (
        <>
          <SectionLabel>Social Card</SectionLabel>
          <TextField label="Label" value={props.label} onChange={(v) => onChangeDebounced('label', v)} />
          <TextField label="Platform" value={props.platform} onChange={(v) => onChangeDebounced('platform', v)} />
          <SelectField label="Layout" value={props.layout ?? 'minimal'} options={['minimal', 'standard', 'full']} onChange={(v) => onChange('layout', v)} />
          <TextField label="Title" value={props.title ?? ''} onChange={(v) => onChangeDebounced('title', v)} />
          <TextField label="Body" value={props.body ?? ''} onChange={(v) => onChangeDebounced('body', v)} multiline />
          <TextField label="CTA Text" value={props.ctaText ?? ''} onChange={(v) => onChangeDebounced('ctaText', v)} />
          <ColorField label="Background" value={props.backgroundColor} onChange={(v) => onChange('backgroundColor', v)} showGradient />
          <ColorField label="Accent" value={props.accentColor ?? '#3b82f6'} onChange={(v) => onChange('accentColor', v)} showGradient />
          <TextField label="Font" value={props.fontFamily ?? 'sans-serif'} onChange={(v) => onChange('fontFamily', v)} />
          <NumberField label="Width" value={props.w} onChange={(v) => onChange('w', v)} />
          <NumberField label="Height" value={props.h} onChange={(v) => onChange('h', v)} />
        </>
      )
    case 'quote-card':
      return (
        <>
          <SectionLabel>Quote Card</SectionLabel>
          <TextField label="Quote" value={props.quoteText} onChange={(v) => onChangeDebounced('quoteText', v)} multiline />
          <TextField label="Author" value={props.author} onChange={(v) => onChangeDebounced('author', v)} />
          <ColorField label="Gradient From" value={props.bgGradientFrom} onChange={(v) => onChange('bgGradientFrom', v)} showGradient />
          <ColorField label="Gradient To" value={props.bgGradientTo} onChange={(v) => onChange('bgGradientTo', v)} showGradient />
          <ColorField label="Text Color" value={props.textColor} onChange={(v) => onChange('textColor', v)} showGradient />
          <SectionLabel>Typography</SectionLabel>
          <TextField label="Font" value={props.fontFamily ?? 'sans-serif'} onChange={(v) => onChange('fontFamily', v)} />
          <NumberField label="Font Weight" value={props.fontWeight ?? 600} onChange={(v) => onChange('fontWeight', v)} step={100} min={100} max={900} />
          <NumberField label="Font Size" value={props.fontSize ?? 32} onChange={(v) => onChange('fontSize', v)} />
          <SelectField label="Text Align" value={props.textAlign ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => onChange('textAlign', v)} />
        </>
      )
    case 'carousel-slide':
      return (
        <>
          <SectionLabel>Carousel Slide</SectionLabel>
          <TextField label="Title" value={props.title} onChange={(v) => onChangeDebounced('title', v)} />
          <TextField label="Body" value={props.body} onChange={(v) => onChangeDebounced('body', v)} multiline />
          <NumberField label="Slide #" value={props.slideNumber} onChange={(v) => onChange('slideNumber', v)} />
          <NumberField label="Total" value={props.totalSlides} onChange={(v) => onChange('totalSlides', v)} />
          <ColorField label="Background" value={props.bgColor} onChange={(v) => onChange('bgColor', v)} showGradient />
          <SectionLabel>Typography</SectionLabel>
          <TextField label="Title Font" value={props.titleFontFamily ?? 'sans-serif'} onChange={(v) => onChange('titleFontFamily', v)} />
          <NumberField label="Title Weight" value={props.titleFontWeight ?? 700} onChange={(v) => onChange('titleFontWeight', v)} step={100} min={100} max={900} />
          <TextField label="Body Font" value={props.bodyFontFamily ?? 'sans-serif'} onChange={(v) => onChange('bodyFontFamily', v)} />
          <NumberField label="Body Size" value={props.bodyFontSize ?? 16} onChange={(v) => onChange('bodyFontSize', v)} />
        </>
      )
    case 'text-overlay':
      return (
        <>
          <SectionLabel>Text Overlay</SectionLabel>
          <TextField label="Text" value={props.text} onChange={(v) => onChangeDebounced('text', v)} multiline />
          <NumberField label="Font Size" value={props.fontSize} onChange={(v) => onChange('fontSize', v)} />
          <ColorField label="Text Color" value={props.textColor} onChange={(v) => onChange('textColor', v)} showGradient />
          <NumberField label="BG Opacity" value={props.bgOpacity} onChange={(v) => onChange('bgOpacity', v)} step={0.1} min={0} max={1} />
          <SelectField label="Position" value={props.position} options={['top', 'center', 'bottom']} onChange={(v) => onChange('position', v)} />
          <SectionLabel>Typography</SectionLabel>
          <TextField label="Font" value={props.fontFamily ?? 'sans-serif'} onChange={(v) => onChange('fontFamily', v)} />
          <NumberField label="Font Weight" value={props.fontWeight ?? 700} onChange={(v) => onChange('fontWeight', v)} step={100} min={100} max={900} />
          <SelectField label="Text Align" value={props.textAlign ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => onChange('textAlign', v)} />
          <NumberField label="Letter Spacing" value={props.letterSpacing ?? 0} onChange={(v) => onChange('letterSpacing', v)} step={0.5} />
          <NumberField label="Line Height" value={props.lineHeight ?? 1.2} onChange={(v) => onChange('lineHeight', v)} step={0.1} min={0.8} max={3} />
        </>
      )
    case 'brand-kit':
      return (
        <>
          <SectionLabel>Brand Kit</SectionLabel>
          <TextField label="Brand Name" value={props.brandName} onChange={(v) => onChangeDebounced('brandName', v)} />
          <TextField label="Tagline" value={props.tagline} onChange={(v) => onChangeDebounced('tagline', v)} />
          <ColorField label="Primary" value={props.primaryColor} onChange={(v) => onChange('primaryColor', v)} showGradient />
          <ColorField label="Secondary" value={props.secondaryColor} onChange={(v) => onChange('secondaryColor', v)} showGradient />
          <TextField label="Font" value={props.fontFamily ?? 'sans-serif'} onChange={(v) => onChange('fontFamily', v)} />
        </>
      )
    case 'enhanced-image':
      return (
        <>
          <SectionLabel>Enhanced Image</SectionLabel>
          <NumberField label="Width" value={props.w} onChange={(v) => onChange('w', v)} />
          <NumberField label="Height" value={props.h} onChange={(v) => onChange('h', v)} />
          <TextField label="Source URL" value={props.src ?? ''} onChange={(v) => onChangeDebounced('src', v)} />
          <button
            type="button"
            onClick={() => {
              // This will be handled by the parent canvas-editor through a prop
              const event = new CustomEvent('open-image-editor', { detail: { shapeId: shape.id } })
              window.dispatchEvent(event)
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '8px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Edit Filters & Effects
          </button>
        </>
      )
    case 'enhanced-text':
      return (
        <>
          <SectionLabel>Enhanced Text</SectionLabel>
          <TextField label="Text" value={props.text} onChange={(v) => onChangeDebounced('text', v)} multiline />
          <NumberField label="Font Size" value={props.fontSize} onChange={(v) => onChange('fontSize', v)} />
          <ColorField label="Text Color" value={props.textColor} onChange={(v) => onChange('textColor', v)} showGradient />
          <NumberField label="BG Opacity" value={props.bgOpacity} onChange={(v) => onChange('bgOpacity', v)} step={0.1} min={0} max={1} />
          <SelectField label="Position" value={props.position} options={['top', 'center', 'bottom']} onChange={(v) => onChange('position', v)} />
          <SectionLabel>Typography</SectionLabel>
          <TextField label="Font" value={props.fontFamily ?? 'sans-serif'} onChange={(v) => onChange('fontFamily', v)} />
          <NumberField label="Font Weight" value={props.fontWeight ?? 700} onChange={(v) => onChange('fontWeight', v)} step={100} min={100} max={900} />
          <SelectField label="Text Align" value={props.textAlign ?? 'center'} options={['left', 'center', 'right']} onChange={(v) => onChange('textAlign', v)} />
          <NumberField label="Letter Spacing" value={props.letterSpacing ?? 0} onChange={(v) => onChange('letterSpacing', v)} step={0.5} />
          <NumberField label="Line Height" value={props.lineHeight ?? 1.2} onChange={(v) => onChange('lineHeight', v)} step={0.1} min={0.8} max={3} />
          <button
            type="button"
            onClick={() => {
              const event = new CustomEvent('open-text-effects', { detail: { shapeId: shape.id } })
              window.dispatchEvent(event)
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '8px',
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Text Effects
          </button>
        </>
      )
    default:
      return <div style={emptyStyle}>No editable properties for this shape type</div>
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 8, marginTop: 4 }}>
      {children}
    </div>
  )
}

function TextField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <Tag
        value={local}
        onChange={(e: any) => { setLocal(e.target.value); onChange(e.target.value) }}
        style={{ ...inputStyle, ...(multiline ? { height: 60, resize: 'vertical' } : {}) }}
      />
    </div>
  )
}

function NumberField({ label, value, onChange, step = 1, min, max }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <div style={fieldStyle}>
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

function ColorField({ label, value, onChange, showGradient = false }: { label: string; value: string; onChange: (v: string) => void; showGradient?: boolean }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 28, height: 28, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: 0 }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        {showGradient && (
          <button
            type="button"
            title="Gradient (coming soon)"
            style={{
              width: 28,
              height: 28,
              border: '1px solid #ddd',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              cursor: 'not-allowed',
              opacity: 0.5,
              padding: 0,
            }}
          />
        )}
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function PresetSelector({ editor }: { editor: Editor }) {
  return (
    <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #eee' }}>
      <SectionLabel>Style Presets</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => {
              const ids = editor.getSelectedShapeIds().map(String)
              if (ids.length > 0) applyStylePreset(editor, ids, preset)
            }}
            style={{ padding: '4px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', color: '#555' }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 300,
  width: 260,
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

const fieldStyle: React.CSSProperties = {
  marginBottom: 10,
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
