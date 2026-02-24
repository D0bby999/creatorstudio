import type { Editor } from 'tldraw'
import { addRecentElement } from '../lib/element-library/recently-used-elements'

interface ShapeDefinition {
  id: string
  label: string
  category: string
  path: string
  viewBox?: string
}

const EXTENDED_SHAPES: ShapeDefinition[] = [
  // Stars
  { id: 'star-5', label: '5-point Star', category: 'Stars', path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', viewBox: '0 0 24 24' },
  { id: 'star-6', label: '6-point Star', category: 'Stars', path: 'M12 1l2.5 5.5L20 9l-3 5.5 3 5.5-5.5 2.5L12 28l-2.5-5.5L4 20l3-5.5L4 9l5.5-2.5L12 1z', viewBox: '0 0 24 28' },
  { id: 'star-8', label: '8-point Star', category: 'Stars', path: 'M12 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z', viewBox: '0 0 24 24' },

  // Hearts
  { id: 'heart', label: 'Heart', category: 'Hearts', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', viewBox: '0 0 24 24' },

  // Arrows
  { id: 'arrow-right', label: 'Arrow Right', category: 'Arrows', path: 'M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z', viewBox: '0 0 24 24' },
  { id: 'arrow-left', label: 'Arrow Left', category: 'Arrows', path: 'M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z', viewBox: '0 0 24 24' },
  { id: 'arrow-up', label: 'Arrow Up', category: 'Arrows', path: 'M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z', viewBox: '0 0 24 24' },
  { id: 'arrow-down', label: 'Arrow Down', category: 'Arrows', path: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z', viewBox: '0 0 24 24' },
  { id: 'arrow-curved', label: 'Curved Arrow', category: 'Arrows', path: 'M10 17l5-5-5-5v3H6c-1.1 0-2 .9-2 2s.9 2 2 2h4v3z', viewBox: '0 0 24 24' },

  // Callouts
  { id: 'callout-round', label: 'Round Callout', category: 'Callouts', path: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z', viewBox: '0 0 24 24' },
  { id: 'callout-cloud', label: 'Cloud Callout', category: 'Callouts', path: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z', viewBox: '0 0 24 24' },

  // Badges
  { id: 'badge-circle', label: 'Circle Badge', category: 'Badges', path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z', viewBox: '0 0 24 24' },
  { id: 'badge-shield', label: 'Shield Badge', category: 'Badges', path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z', viewBox: '0 0 24 24' },

  // Ribbons
  { id: 'ribbon-flag', label: 'Flag Ribbon', category: 'Ribbons', path: 'M5 3v18l7-3 7 3V3z', viewBox: '0 0 24 24' },

  // Polygons
  { id: 'hexagon', label: 'Hexagon', category: 'Polygons', path: 'M12 2l9 5v10l-9 5-9-5V7z', viewBox: '0 0 24 24' },
  { id: 'pentagon', label: 'Pentagon', category: 'Polygons', path: 'M12 2l9 7-3.5 11h-11L3 9z', viewBox: '0 0 24 24' },
  { id: 'parallelogram', label: 'Parallelogram', category: 'Polygons', path: 'M6 4l14 0-4 16H2z', viewBox: '0 0 24 24' },
]

interface ElementLibraryShapesTabProps {
  editor: Editor
}

export function ElementLibraryShapesTab({ editor }: ElementLibraryShapesTabProps) {
  const handleShapeClick = (shape: ShapeDefinition) => {
    const viewport = editor.getViewportPageBounds()
    const centerX = viewport.x + viewport.width / 2
    const centerY = viewport.y + viewport.height / 2

    const svgString = `<svg viewBox="${shape.viewBox || '0 0 24 24'}" xmlns="http://www.w3.org/2000/svg"><path d="${shape.path}"/></svg>`

    editor.putExternalContent({
      type: 'svg-text',
      text: svgString,
      point: { x: centerX - 48, y: centerY - 48 },
    })

    addRecentElement({
      type: 'shape',
      id: shape.id,
      preview: svgString,
      label: shape.label,
    })
  }

  // Group shapes by category
  const categories = Array.from(new Set(EXTENDED_SHAPES.map(s => s.category)))

  return (
    <div style={{ padding: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
      {categories.map(category => (
        <div key={category} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>
            {category}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {EXTENDED_SHAPES.filter(s => s.category === category).map(shape => (
              <div
                key={shape.id}
                onClick={() => handleShapeClick(shape)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox={shape.viewBox || '0 0 24 24'}
                  style={{ fill: '#333' }}
                >
                  <path d={shape.path} />
                </svg>
                <div style={{ fontSize: 9, color: '#666', textAlign: 'center', lineHeight: 1.2 }}>
                  {shape.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
