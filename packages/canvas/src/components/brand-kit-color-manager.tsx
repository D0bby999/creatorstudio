/**
 * Manages brand kit color palette
 */
import { useState } from 'react'
import type { BrandColorData, BrandColorRole } from '../lib/brand-kit/brand-kit-types'

interface BrandKitColorManagerProps {
  colors: BrandColorData[]
  onChange: (colors: BrandColorData[]) => void
}

const COLOR_ROLES: Array<{ value: BrandColorRole; label: string }> = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'accent', label: 'Accent' },
  { value: 'bg', label: 'Background' },
  { value: 'text', label: 'Text' },
]

export function BrandKitColorManager({ colors, onChange }: BrandKitColorManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [label, setLabel] = useState('')
  const [hex, setHex] = useState('#000000')
  const [role, setRole] = useState<BrandColorRole>('accent')

  const handleAdd = () => {
    if (colors.length >= 20) {
      alert('Maximum 20 colors allowed')
      return
    }
    if (!label.trim() || !hex.match(/^#[0-9a-fA-F]{3,8}$/)) {
      alert('Invalid color label or hex value')
      return
    }
    const newColor: BrandColorData = {
      id: `temp-${Date.now()}`,
      label: label.trim(),
      hex,
      role,
      sortOrder: colors.length,
    }
    onChange([...colors, newColor])
    setLabel('')
    setHex('#000000')
    setRole('accent')
    setShowAdd(false)
  }

  const handleUpdate = (id: string, updates: Partial<BrandColorData>) => {
    onChange(colors.map(c => c.id === id ? { ...c, ...updates } : c))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    onChange(colors.filter(c => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {colors.map(color => (
          <div key={color.id} style={{ position: 'relative' }}>
            {editingId === color.id ? (
              <div style={{
                padding: 8, border: '1px solid #ddd', borderRadius: 4,
                background: '#fff', width: 200
              }}>
                <input
                  type="text"
                  value={color.label}
                  onChange={e => handleUpdate(color.id!, { label: e.target.value })}
                  style={{ width: '100%', marginBottom: 4, padding: 4 }}
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={color.hex}
                  onChange={e => handleUpdate(color.id!, { hex: e.target.value })}
                  style={{ width: '100%', marginBottom: 4, padding: 4 }}
                  placeholder="#000000"
                />
                <select
                  value={color.role}
                  onChange={e => handleUpdate(color.id!, { role: e.target.value as BrandColorRole })}
                  style={{ width: '100%', padding: 4 }}
                >
                  {COLOR_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            ) : (
              <div
                onClick={() => setEditingId(color.id!)}
                style={{
                  width: 64, height: 64, borderRadius: 4, cursor: 'pointer',
                  background: color.hex, border: '2px solid #ddd',
                  position: 'relative', display: 'flex', alignItems: 'flex-end',
                  padding: 4,
                }}
                title={`${color.label} (${color.role})`}
              >
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(color.id!) }}
                  style={{
                    position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                    background: '#fff', border: '1px solid #999', borderRadius: 2,
                    cursor: 'pointer', fontSize: 10, lineHeight: 1,
                  }}
                >
                  ×
                </button>
                <span style={{ fontSize: 9, color: '#fff', textShadow: '0 0 2px #000' }}>
                  {color.label}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, background: '#f9f9f9' }}>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Color label"
            style={{ width: '100%', marginBottom: 4, padding: 6 }}
          />
          <input
            type="text"
            value={hex}
            onChange={e => setHex(e.target.value)}
            placeholder="#000000"
            style={{ width: '100%', marginBottom: 4, padding: 6 }}
          />
          <select value={role} onChange={e => setRole(e.target.value as BrandColorRole)} style={{ width: '100%', marginBottom: 8, padding: 6 }}>
            {COLOR_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ flex: 1, padding: 6 }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 6 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{ padding: 8, cursor: 'pointer' }}>
          + Add Color
        </button>
      )}
    </div>
  )
}
