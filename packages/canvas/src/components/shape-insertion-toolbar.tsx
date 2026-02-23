import type { Editor } from 'tldraw'

interface ShapeInsertionToolbarProps {
  editor: Editor
}

/** Toolbar for inserting custom shapes at camera center */
export function ShapeInsertionToolbar({ editor }: ShapeInsertionToolbarProps) {
  const insertShape = (type: string, props: Record<string, any>) => {
    const center = editor.getViewportPageBounds().center
    editor.createShape({
      type,
      x: center.x - props.w / 2,
      y: center.y - props.h / 2,
      props,
    } as any)
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        display: 'flex',
        gap: 4,
        background: 'var(--color-background, #fff)',
        borderRadius: 8,
        padding: '4px 8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        border: '1px solid var(--color-border, #e5e5e5)',
      }}
    >
      <button
        onClick={() =>
          insertShape('quote-card', {
            w: 1080,
            h: 1080,
            quoteText: 'Your inspiring quote here',
            author: 'Author Name',
            bgGradientFrom: '#8b5cf6',
            bgGradientTo: '#ec4899',
            textColor: '#ffffff',
          })
        }
        style={btnStyle}
        title="Insert quote card with gradient background"
      >
        Quote Card
      </button>
      <button
        onClick={() =>
          insertShape('carousel-slide', {
            w: 1080,
            h: 1080,
            slideNumber: 1,
            totalSlides: 5,
            title: 'Slide Title',
            body: 'Add your content here',
            bgColor: '#ffffff',
          })
        }
        style={btnStyle}
        title="Insert carousel slide"
      >
        Carousel
      </button>
      <button
        onClick={() =>
          insertShape('text-overlay', {
            w: 1080,
            h: 200,
            text: 'Your text here',
            fontSize: 48,
            textColor: '#ffffff',
            bgOpacity: 0.5,
            position: 'center',
          })
        }
        style={btnStyle}
        title="Insert text overlay with semi-transparent background"
      >
        Text Overlay
      </button>
      <button
        onClick={() =>
          insertShape('social-card', {
            w: 1080,
            h: 1080,
            label: 'Instagram Post',
            platform: 'instagram',
            backgroundColor: '#ffffff',
            title: '',
            body: '',
            ctaText: '',
            fontFamily: 'sans-serif',
            accentColor: '#3b82f6',
            layout: 'minimal',
          })
        }
        style={btnStyle}
        title="Insert social media card template"
      >
        Social Card
      </button>
      <button
        onClick={() =>
          insertShape('brand-kit', {
            w: 400,
            h: 300,
            brandName: 'Brand Name',
            tagline: 'Your tagline here',
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            fontFamily: 'sans-serif',
            logoPlaceholder: true,
          })
        }
        style={btnStyle}
        title="Insert brand kit reference"
      >
        Brand Kit
      </button>
      <div style={{ width: 1, background: '#e0e0e0', margin: '2px 4px' }} />
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
  )
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
