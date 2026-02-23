import { useState, useEffect } from 'react'
import type { Editor, TLShape } from 'tldraw'

interface LayersPanelProps {
  editor: Editor
  onClose: () => void
}

export function LayersPanel({ editor, onClose }: LayersPanelProps) {
  const [shapes, setShapes] = useState<TLShape[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const update = () => {
      const pageShapes = editor.getCurrentPageShapes()
      setShapes([...pageShapes].reverse())
      setSelectedIds(new Set(editor.getSelectedShapeIds()))
    }
    update()
    const unsub = editor.store.listen(update, { scope: 'document' })
    return () => unsub()
  }, [editor])

  const selectShape = (id: string) => {
    editor.select(id as any)
  }

  const toggleLock = (shape: TLShape) => {
    editor.toggleLock([shape.id])
  }

  const bringForward = (id: string) => {
    editor.bringForward([id as any])
  }

  const sendBackward = (id: string) => {
    editor.sendBackward([id as any])
  }

  const bringToFront = (id: string) => {
    editor.bringToFront([id as any])
  }

  const sendToBack = (id: string) => {
    editor.sendToBack([id as any])
  }

  const deleteShape = (id: string) => {
    editor.deleteShapes([id as any])
  }

  const getShapeLabel = (shape: TLShape): string => {
    const props = shape.props as Record<string, any>
    return props.label ?? props.title ?? props.text ?? props.quoteText?.slice(0, 20) ?? shape.type
  }

  const shapeTypeIcons: Record<string, string> = {
    'social-card': '▢',
    'quote-card': '❝',
    'carousel-slide': '▤',
    'text-overlay': 'T',
    'brand-kit': '◆',
    'image': '🖼',
    'draw': '✎',
    'text': 'A',
    'geo': '○',
    'arrow': '→',
    'note': '📝',
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div style={{ overflow: 'auto', maxHeight: 400 }}>
        {shapes.length === 0 && (
          <div style={emptyStyle}>No shapes on canvas</div>
        )}

        {shapes.map((shape: TLShape) => {
          const isSelected = selectedIds.has(shape.id)
          const isLocked = shape.isLocked
          return (
            <div
              key={shape.id}
              onClick={() => selectShape(shape.id)}
              style={{
                ...layerRowStyle,
                background: isSelected ? '#e8f0fe' : 'transparent',
              }}
            >
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>
                {shapeTypeIcons[shape.type] ?? '◻'}
              </span>
              <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getShapeLabel(shape)}
              </span>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <IconBtn title="Bring forward" onClick={(e: React.MouseEvent) => { e.stopPropagation(); bringForward(shape.id) }}>↑</IconBtn>
                <IconBtn title="Send backward" onClick={(e: React.MouseEvent) => { e.stopPropagation(); sendBackward(shape.id) }}>↓</IconBtn>
                <IconBtn
                  title={isLocked ? 'Unlock' : 'Lock'}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleLock(shape) }}
                  active={isLocked}
                >
                  {isLocked ? '🔒' : '🔓'}
                </IconBtn>
                <IconBtn title="Delete" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteShape(shape.id) }}>×</IconBtn>
              </div>
            </div>
          )
        })}
      </div>

      {shapes.length > 1 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', display: 'flex', gap: 4 }}>
          <SmallBtn onClick={() => { const ids = editor.getSelectedShapeIds(); if (ids.length > 0) bringToFront(ids[0] as string) }}>
            To Front
          </SmallBtn>
          <SmallBtn onClick={() => { const ids = editor.getSelectedShapeIds(); if (ids.length > 0) sendToBack(ids[0] as string) }}>
            To Back
          </SmallBtn>
          {editor.getSelectedShapeIds().length > 1 && (
            <>
              <SmallBtn onClick={() => editor.groupShapes(editor.getSelectedShapeIds())}>Group</SmallBtn>
              <SmallBtn onClick={() => editor.ungroupShapes(editor.getSelectedShapeIds())}>Ungroup</SmallBtn>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, active }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? '#e0e0e0' : 'none',
        border: 'none',
        fontSize: 11,
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 3,
        color: '#666',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  )
}

function SmallBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        fontSize: 11,
        fontWeight: 500,
        borderRadius: 4,
        border: '1px solid #ddd',
        background: '#fff',
        cursor: 'pointer',
        color: '#444',
      }}
    >
      {children}
    </button>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
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

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
  textAlign: 'center',
  padding: '24px 0',
}

const layerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #f5f5f5',
}
