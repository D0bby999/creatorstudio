import { useState, useEffect, useRef, useCallback } from 'react'
import { HslColorPicker } from 'react-colorful'
import 'react-colorful/dist/index.css'
import { isEyeDropperSupported, pickColor } from '../lib/eyedropper-tool'
import { hexToRgb, rgbToHex, rgbToHsl, hslToHex } from '../lib/color-conversion-utils'
import { SwatchSection } from './color-swatch-section'
import type { GradientDef } from '../lib/gradient/gradient-types'

const PRESET_SWATCHES = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9', '#14b8a6',
]
const RECENT_KEY = 'canvas-recent-colors'
const MAX_RECENT = 8

interface AdvancedColorPickerProps {
  value: string
  onChange: (color: string) => void
  brandColors?: string[]
  showGradient?: boolean
  onGradientChange?: (def: GradientDef) => void
}

export function AdvancedColorPicker({
  value,
  onChange,
  brandColors = [],
  showGradient = false,
  onGradientChange,
}: AdvancedColorPickerProps) {
  const [recent, setRecent] = useState<string[]>([])
  const [hexInput, setHexInput] = useState(value)
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 })
  const [hsl, setHsl] = useState({ h: 0, s: 0, l: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setHexInput(value)
    const rgbVal = hexToRgb(value)
    if (rgbVal) {
      setRgb(rgbVal)
      setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b))
    }
  }, [value])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY)
      if (stored) setRecent(JSON.parse(stored))
    } catch { /* empty */ }
  }, [])

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
    }, 50)
  }, [onChange, addToRecent])

  const handleHslChange = (newHsl: { h: number; s: number; l: number }) => {
    setHsl(newHsl)
    const hex = hslToHex(newHsl.h, newHsl.s, newHsl.l)
    setHexInput(hex)
    const rgbVal = hexToRgb(hex)
    if (rgbVal) setRgb(rgbVal)
    handleColorChange(hex)
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const clamped = Math.max(0, Math.min(255, val))
    const newRgb = { ...rgb, [channel]: clamped }
    setRgb(newRgb)
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b)
    setHexInput(hex)
    setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))
    handleColorChange(hex)
  }

  const handleHexSubmit = () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
      const rgbVal = hexToRgb(hexInput)
      if (rgbVal) {
        setRgb(rgbVal)
        setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b))
      }
      onChange(hexInput)
      addToRecent(hexInput)
    }
  }

  const handleEyedropper = async () => {
    const color = await pickColor()
    if (color) {
      setHexInput(color)
      const rgbVal = hexToRgb(color)
      if (rgbVal) {
        setRgb(rgbVal)
        setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b))
      }
      onChange(color)
      addToRecent(color)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <HslColorPicker color={hsl} onChange={handleHslChange} style={{ width: '100%' }} />

      <div style={{ display: 'flex', gap: 4 }}>
        <NumericInput label="R" value={rgb.r} onChange={(v) => handleRgbChange('r', v)} max={255} />
        <NumericInput label="G" value={rgb.g} onChange={(v) => handleRgbChange('g', v)} max={255} />
        <NumericInput label="B" value={rgb.b} onChange={(v) => handleRgbChange('b', v)} max={255} />
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={handleHexSubmit}
          onKeyDown={(e) => { if (e.key === 'Enter') handleHexSubmit() }}
          style={hexInputStyle}
          placeholder="#000000"
        />
        {isEyeDropperSupported() && (
          <button onClick={handleEyedropper} style={eyedropperBtnStyle} title="Pick color from screen">
            🎨
          </button>
        )}
      </div>

      <SwatchSection label="Presets" colors={PRESET_SWATCHES} value={value} onSelect={(c) => { setHexInput(c); handleColorChange(c) }} />

      {brandColors.length > 0 && (
        <SwatchSection label="Brand" colors={brandColors} value={value} onSelect={(c) => { setHexInput(c); handleColorChange(c) }} />
      )}

      {recent.length > 0 && (
        <SwatchSection label="Recent" colors={recent} value={value} onSelect={(c) => { setHexInput(c); handleColorChange(c) }} />
      )}
    </div>
  )
}

function NumericInput({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        max={max}
        style={numericInputStyle}
      />
    </div>
  )
}

const hexInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 6px',
  fontSize: 12,
  border: '1px solid #ddd',
  borderRadius: 4,
  fontFamily: 'monospace',
}

const numericInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '3px 4px',
  fontSize: 11,
  border: '1px solid #ddd',
  borderRadius: 3,
  textAlign: 'center',
}

const eyedropperBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: '1px solid #ddd',
  borderRadius: 4,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
