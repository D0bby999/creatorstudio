import { useState, useCallback } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { SocialCardShapeUtil } from '../shapes/social-card-shape'
import { QuoteCardShapeUtil } from '../shapes/quote-card-shape'
import { CarouselSlideShapeUtil } from '../shapes/carousel-slide-shape'
import { TextOverlayShapeUtil } from '../shapes/text-overlay-shape'
import { ExportPanel } from './export-panel'
import { TemplatePanel } from './template-panel'
import { ShapeInsertionToolbar } from './shape-insertion-toolbar'

const customShapeUtils = [
  SocialCardShapeUtil,
  QuoteCardShapeUtil,
  CarouselSlideShapeUtil,
  TextOverlayShapeUtil,
]

interface CanvasEditorProps {
  /** Key for browser persistence (IndexedDB) */
  persistenceKey?: string
}

/** Main canvas editor wrapping Tldraw with custom shapes and panels */
export function CanvasEditor({ persistenceKey = 'creator-studio-canvas' }: CanvasEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 8,
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
          onClick={() => {
            setShowTemplates(!showTemplates)
            setShowExport(false)
          }}
          style={toolbarBtnStyle(showTemplates)}
        >
          Templates
        </button>
        <button
          onClick={() => {
            setShowExport(!showExport)
            setShowTemplates(false)
          }}
          style={toolbarBtnStyle(showExport)}
        >
          Export
        </button>
      </div>

      {/* Template picker panel */}
      {showTemplates && editor && (
        <TemplatePanel editor={editor} onClose={() => setShowTemplates(false)} />
      )}

      {/* Export panel */}
      {showExport && editor && (
        <ExportPanel editor={editor} onClose={() => setShowExport(false)} />
      )}

      {/* Shape insertion toolbar */}
      {editor && <ShapeInsertionToolbar editor={editor} />}

      {/* Tldraw canvas */}
      <Tldraw
        persistenceKey={persistenceKey}
        shapeUtils={customShapeUtils}
        onMount={handleMount}
      />
    </div>
  )
}

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#e8e8e8' : 'transparent',
    color: '#333',
  }
}
