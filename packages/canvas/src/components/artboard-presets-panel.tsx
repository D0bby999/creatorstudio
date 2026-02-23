import type { Editor } from 'tldraw'
import { canvasTemplates, type CanvasTemplate } from '../templates/canvas-templates'

interface ArtboardPresetsPanelProps {
  editor: Editor
  onClose: () => void
}

const presetGroups: { label: string; presets: { name: string; w: number; h: number }[] }[] = [
  {
    label: 'Instagram',
    presets: [
      { name: 'Post (1:1)', w: 1080, h: 1080 },
      { name: 'Story (9:16)', w: 1080, h: 1920 },
      { name: 'Reel Cover', w: 1080, h: 1920 },
    ],
  },
  {
    label: 'YouTube',
    presets: [
      { name: 'Thumbnail', w: 1280, h: 720 },
      { name: 'Banner', w: 2560, h: 1440 },
    ],
  },
  {
    label: 'Twitter',
    presets: [
      { name: 'Post', w: 1200, h: 675 },
      { name: 'Header', w: 1500, h: 500 },
    ],
  },
  {
    label: 'Facebook',
    presets: [
      { name: 'Post', w: 1200, h: 630 },
      { name: 'Cover', w: 820, h: 312 },
    ],
  },
  {
    label: 'TikTok',
    presets: [{ name: 'Cover', w: 1080, h: 1920 }],
  },
  {
    label: 'LinkedIn',
    presets: [
      { name: 'Post', w: 1200, h: 1200 },
      { name: 'Banner', w: 1584, h: 396 },
    ],
  },
  {
    label: 'General',
    presets: [
      { name: 'Presentation', w: 1920, h: 1080 },
      { name: 'Pinterest', w: 1000, h: 1500 },
    ],
  },
]

export function ArtboardPresetsPanel({ editor, onClose }: ArtboardPresetsPanelProps) {
  const applyPreset = (w: number, h: number) => {
    const selected = editor.getSelectedShapes()
    const socialCard = selected.find((s) => (s.type as string) === 'social-card')

    if (socialCard) {
      editor.updateShapes([{ id: socialCard.id, type: socialCard.type, props: { w, h } } as any])
    } else {
      const center = editor.getViewportPageBounds().center
      editor.createShape({
        type: 'social-card',
        x: center.x - w / 2,
        y: center.y - h / 2,
        props: { w, h, label: `${w}×${h}`, platform: 'custom', backgroundColor: '#ffffff', title: '', body: '', ctaText: '', fontFamily: 'sans-serif', accentColor: '#3b82f6', layout: 'minimal' },
      } as any)
    }

    editor.zoomToFit({ animation: { duration: 300 } })
    onClose()
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Artboard Size</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 400, padding: '8px 12px' }}>
        {presetGroups.map((group) => (
          <div key={group.label} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>
              {group.label}
            </div>
            {group.presets.map((p) => (
              <button key={p.name} onClick={() => applyPreset(p.w, p.h)} style={presetBtnStyle}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: 10, color: '#999' }}>{p.w}×{p.h}</span>
              </button>
            ))}
          </div>
        ))}
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

const presetBtnStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
  padding: '6px 8px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 4,
  textAlign: 'left',
}
