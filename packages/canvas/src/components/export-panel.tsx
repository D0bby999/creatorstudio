import { useState } from 'react'
import type { Editor } from 'tldraw'
import { exportAndDownload, type ExportFormat } from '../lib/canvas-export'

interface ExportPanelProps {
  editor: Editor
  onClose: () => void
}

const formats: { value: ExportFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
  { value: 'webp', label: 'WebP' },
  { value: 'jpeg', label: 'JPEG' },
]

const scales = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
]

/** Panel for exporting canvas to image formats */
export function ExportPanel({ editor, onClose }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState(2)
  const [background, setBackground] = useState(true)
  const [exporting, setExporting] = useState(false)

  const selectedCount = editor.getSelectedShapeIds().length

  const handleExport = async () => {
    setExporting(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `creator-studio-${timestamp}.${format}`
      await exportAndDownload(editor, filename, { format, scale, background })
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Export</span>
        <button onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
      </div>

      <div style={{ padding: '12px' }}>
        {/* Format selection */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Format</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {formats.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                style={{
                  ...chipStyle,
                  background: format === f.value ? '#333' : '#f0f0f0',
                  color: format === f.value ? '#fff' : '#555',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scale selection */}
        {format !== 'svg' && (
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Scale</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {scales.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScale(s.value)}
                  style={{
                    ...chipStyle,
                    background: scale === s.value ? '#333' : '#f0f0f0',
                    color: scale === s.value ? '#fff' : '#555',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Background toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={background}
              onChange={(e) => setBackground(e.target.checked)}
            />
            Include background
          </label>
        </div>

        {/* Info text */}
        <div style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>
          {selectedCount > 0
            ? `Exporting ${selectedCount} selected shape${selectedCount > 1 ? 's' : ''}`
            : 'Exporting entire canvas'}
        </div>

        {/* Export button */}
        <button onClick={handleExport} disabled={exporting} style={exportBtnStyle}>
          {exporting ? 'Exporting...' : `Download .${format}`}
        </button>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  width: 280,
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

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#666',
  marginBottom: 6,
  display: 'block',
}

const chipStyle: React.CSSProperties = {
  padding: '5px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
}

const exportBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: 'none',
  background: '#333',
  color: '#fff',
  cursor: 'pointer',
}
