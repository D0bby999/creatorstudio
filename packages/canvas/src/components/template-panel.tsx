import type { Editor } from 'tldraw'
import { canvasTemplates, getTemplatesByCategory, type CanvasTemplate } from '../templates/canvas-templates'

interface TemplatePanelProps {
  editor: Editor
  onClose: () => void
}

/** Panel for selecting and applying canvas templates */
export function TemplatePanel({ editor, onClose }: TemplatePanelProps) {
  const grouped = getTemplatesByCategory()

  const applyTemplate = (template: CanvasTemplate) => {
    // Create a social-card shape as the artboard background
    editor.createShape({
      type: 'social-card',
      x: 0,
      y: 0,
      props: {
        w: template.width,
        h: template.height,
        label: template.name,
        platform: template.category.toLowerCase(),
        backgroundColor: '#ffffff',
      },
    })

    // Zoom to fit the new shape
    editor.zoomToFit({ animation: { duration: 300 } })
    onClose()
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Templates</span>
        <button onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 400, padding: '8px 12px' }}>
        {Object.entries(grouped).map(([category, templates]) => (
          <div key={category} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase' }}>
              {category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {templates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} style={templateCardStyle}>
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: `${t.width}/${t.height}`,
                      maxHeight: 60,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      border: '1px dashed #ddd',
                      marginBottom: 4,
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>{t.description}</div>
                </button>
              ))}
            </div>
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
  width: 320,
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

const templateCardStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #eee',
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s',
}
