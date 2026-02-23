import { useState, useCallback } from 'react'
import type { Editor } from 'tldraw'

interface ShapeInsertionToolbarProps {
  editor: Editor
}

type GeoSubType =
  | 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon'
  | 'hexagon' | 'octagon' | 'star' | 'rhombus' | 'oval'
  | 'trapezoid' | 'cloud' | 'heart' | 'x-box' | 'check-box'
  | 'arrow-up' | 'arrow-down' | 'arrow-left' | 'arrow-right'

const GEO_TYPES: { id: GeoSubType; label: string; icon: string }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: '\u25A0' },
  { id: 'ellipse', label: 'Ellipse', icon: '\u25CF' },
  { id: 'triangle', label: 'Triangle', icon: '\u25B2' },
  { id: 'diamond', label: 'Diamond', icon: '\u25C6' },
  { id: 'star', label: 'Star', icon: '\u2605' },
  { id: 'heart', label: 'Heart', icon: '\u2665' },
  { id: 'cloud', label: 'Cloud', icon: '\u2601' },
  { id: 'pentagon', label: 'Pentagon', icon: '\u2B1F' },
  { id: 'hexagon', label: 'Hexagon', icon: '\u2B22' },
  { id: 'octagon', label: 'Octagon', icon: '\u2BC2' },
  { id: 'rhombus', label: 'Rhombus', icon: '\u25C7' },
  { id: 'oval', label: 'Oval', icon: '\u2B2D' },
  { id: 'trapezoid', label: 'Trapezoid', icon: '\u23E2' },
  { id: 'arrow-up', label: 'Arrow Up', icon: '\u2B06' },
  { id: 'arrow-down', label: 'Arrow Down', icon: '\u2B07' },
  { id: 'arrow-left', label: 'Arrow Left', icon: '\u2B05' },
  { id: 'arrow-right', label: 'Arrow Right', icon: '\u27A1' },
  { id: 'x-box', label: 'X Box', icon: '\u2327' },
  { id: 'check-box', label: 'Check Box', icon: '\u2611' },
]

/** Toolbar for inserting shapes at camera center */
export function ShapeInsertionToolbar({ editor }: ShapeInsertionToolbarProps) {
  const [showGeoDropdown, setShowGeoDropdown] = useState(false)

  const insertAtCenter = useCallback((type: string, props: Record<string, unknown>) => {
    const center = editor.getViewportPageBounds().center
    const w = (props.w as number) ?? 100
    const h = (props.h as number) ?? 100
    editor.createShape({
      type,
      x: center.x - w / 2,
      y: center.y - h / 2,
      props,
    } as any)
  }, [editor])

  const insertGeo = useCallback((geo: GeoSubType) => {
    insertAtCenter('geo', { w: 100, h: 100, geo })
    setShowGeoDropdown(false)
  }, [insertAtCenter])

  const insertFrame = useCallback(() => {
    insertAtCenter('frame', { w: 320, h: 180, name: '' })
  }, [insertAtCenter])

  return (
    <div style={containerStyle}>
      {/* Built-in shape insertion */}
      <div style={sectionStyle}>
        <span style={sectionLabelStyle}>Shapes</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowGeoDropdown(v => !v)}
            style={btnStyle}
            title="Insert geometric shape (R)"
          >
            Geo \u25BE
          </button>
          {showGeoDropdown && (
            <GeoDropdown onSelect={insertGeo} onClose={() => setShowGeoDropdown(false)} />
          )}
        </div>
        <button onClick={insertFrame} style={btnStyle} title="Insert frame container (F)">
          Frame
        </button>
      </div>

      <div style={separatorStyle} />

      {/* Custom creator shapes */}
      <div style={sectionStyle}>
        <span style={sectionLabelStyle}>Creator</span>
        <button
          onClick={() => insertAtCenter('quote-card', {
            w: 1080, h: 1080, quoteText: 'Your inspiring quote here',
            author: 'Author Name', bgGradientFrom: '#8b5cf6',
            bgGradientTo: '#ec4899', textColor: '#ffffff',
          })}
          style={btnStyle}
          title="Insert quote card with gradient background"
        >
          Quote Card
        </button>
        <button
          onClick={() => insertAtCenter('carousel-slide', {
            w: 1080, h: 1080, slideNumber: 1, totalSlides: 5,
            title: 'Slide Title', body: 'Add your content here', bgColor: '#ffffff',
          })}
          style={btnStyle}
          title="Insert carousel slide"
        >
          Carousel
        </button>
        <button
          onClick={() => insertAtCenter('text-overlay', {
            w: 1080, h: 200, text: 'Your text here', fontSize: 48,
            textColor: '#ffffff', bgOpacity: 0.5, position: 'center',
          })}
          style={btnStyle}
          title="Insert text overlay with semi-transparent background"
        >
          Text Overlay
        </button>
        <button
          onClick={() => insertAtCenter('social-card', {
            w: 1080, h: 1080, label: 'Instagram Post', platform: 'instagram',
            backgroundColor: '#ffffff', title: '', body: '', ctaText: '',
            fontFamily: 'sans-serif', accentColor: '#3b82f6', layout: 'minimal',
          })}
          style={btnStyle}
          title="Insert social media card template"
        >
          Social Card
        </button>
        <button
          onClick={() => insertAtCenter('brand-kit', {
            w: 400, h: 300, brandName: 'Brand Name', tagline: 'Your tagline here',
            primaryColor: '#3b82f6', secondaryColor: '#8b5cf6',
            fontFamily: 'sans-serif', logoPlaceholder: true,
          })}
          style={btnStyle}
          title="Insert brand kit reference"
        >
          Brand Kit
        </button>
      </div>

      <div style={separatorStyle} />

      {/* Tool-based insertions */}
      <div style={sectionStyle}>
        <span style={sectionLabelStyle}>Tools</span>
        <button
          onClick={() => editor.setCurrentTool('connector')}
          style={btnStyle}
          title="Draw connector between shapes (C)"
        >
          Connector
        </button>
        <button
          onClick={() => editor.setCurrentTool('crop')}
          style={btnStyle}
          title="Crop selected image"
        >
          Crop
        </button>
      </div>
    </div>
  )
}

function GeoDropdown({ onSelect, onClose }: { onSelect: (g: GeoSubType) => void; onClose: () => void }) {
  return (
    <>
      <div style={backdropStyle} onClick={onClose} />
      <div style={dropdownStyle}>
        {GEO_TYPES.map(g => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            style={dropdownItemStyle}
            title={g.label}
          >
            <span>{g.icon}</span>
            <span style={{ fontSize: 11 }}>{g.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 60,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: '4px 8px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  border: '1px solid var(--color-border, #e5e5e5)',
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: '#999',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginRight: 2,
}

const separatorStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  background: '#e0e0e0',
  margin: '0 4px',
}

const btnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  background: 'transparent',
  color: '#333',
  whiteSpace: 'nowrap',
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 399,
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  marginTop: 4,
  zIndex: 400,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  border: '1px solid var(--color-border, #e5e5e5)',
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 2,
  width: 280,
}

const dropdownItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  padding: '6px 4px',
  fontSize: 14,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  background: 'transparent',
  color: '#333',
}
