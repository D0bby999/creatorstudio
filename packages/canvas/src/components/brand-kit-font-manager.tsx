/**
 * Manages brand kit font settings
 */
import { useEffect } from 'react'
import type { BrandFontData, BrandFontRole } from '../lib/brand-kit/brand-kit-types'
import { loadFont } from '../lib/canvas-font-loader'

interface BrandKitFontManagerProps {
  fonts: BrandFontData[]
  onChange: (fonts: BrandFontData[]) => void
}

const FONT_ROLES: Array<{ value: BrandFontRole; label: string }> = [
  { value: 'heading', label: 'Heading' },
  { value: 'body', label: 'Body' },
  { value: 'accent', label: 'Accent' },
]

const FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900]

export function BrandKitFontManager({ fonts, onChange }: BrandKitFontManagerProps) {
  const getFont = (role: BrandFontRole): BrandFontData => {
    return fonts.find(f => f.role === role) || { role, family: 'Inter', weight: 400 }
  }

  const handleUpdate = (role: BrandFontRole, updates: Partial<BrandFontData>) => {
    const existing = fonts.find(f => f.role === role)
    if (existing) {
      onChange(fonts.map(f => f.role === role ? { ...f, ...updates } : f))
    } else {
      onChange([...fonts, { role, family: 'Inter', weight: 400, ...updates }])
    }
  }

  useEffect(() => {
    fonts.forEach(font => {
      loadFont(font.family, font.weight).catch(() => {})
    })
  }, [fonts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {FONT_ROLES.map(({ value, label }) => {
        const font = getFont(value)
        return (
          <div key={value} style={{ padding: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{label}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={font.family}
                onChange={e => handleUpdate(value, { family: e.target.value })}
                placeholder="Font family"
                style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 3 }}
              />
              <select
                value={font.weight}
                onChange={e => handleUpdate(value, { weight: Number(e.target.value) })}
                style={{ padding: 6, border: '1px solid #ccc', borderRadius: 3 }}
              >
                {FONT_WEIGHTS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div
              style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontSize: 16,
                padding: 8,
                background: '#f9f9f9',
                borderRadius: 3,
                border: '1px solid #eee',
              }}
            >
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        )
      })}
    </div>
  )
}
