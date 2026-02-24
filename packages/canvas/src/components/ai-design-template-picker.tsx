/**
 * Template preset picker for AI design generation
 * Grid of 4 presets + custom option
 */

interface DesignTemplatePreset {
  id: string
  label: string
  width: number
  height: number
  description: string
}

const PRESETS: DesignTemplatePreset[] = [
  { id: 'social-post', label: 'Social Post', width: 1080, height: 1080, description: 'Square 1:1' },
  { id: 'story', label: 'Story', width: 1080, height: 1920, description: 'Vertical 9:16' },
  { id: 'banner', label: 'Banner', width: 1200, height: 628, description: 'Horizontal 2:1' },
  { id: 'presentation', label: 'Slide', width: 1920, height: 1080, description: 'Widescreen 16:9' },
]

interface AiDesignTemplatePickerProps {
  selected: string | null
  onSelect: (presetId: string) => void
}

export function AiDesignTemplatePicker({ selected, onSelect }: AiDesignTemplatePickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      {PRESETS.map(preset => {
        const isActive = selected === preset.id
        const aspect = preset.width / preset.height
        const previewW = 32
        const previewH = previewW / aspect

        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 8px',
              border: isActive ? '2px solid #333' : '1px solid #e0e0e0',
              borderRadius: 6,
              background: isActive ? '#f5f5f5' : '#fff',
              cursor: 'pointer',
              fontSize: 11,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: previewW,
                height: Math.max(previewH, 16),
                border: '1px solid #ccc',
                borderRadius: 2,
                backgroundColor: '#f0f0f0',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 11 }}>{preset.label}</div>
              <div style={{ fontSize: 9, color: '#999' }}>{preset.description}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
