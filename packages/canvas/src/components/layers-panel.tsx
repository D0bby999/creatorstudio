import { useState, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Editor, TLShape, TLShapeId } from 'tldraw'

interface LayersPanelProps {
  editor: Editor
  onClose: () => void
}

const ITEM_HEIGHT = 34

export function LayersPanel({ editor, onClose }: LayersPanelProps) {
  const [shapes, setShapes] = useState<TLShape[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const virtualizer = useVirtualizer({
    count: shapes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 8,
  })

  const selectShape = (id: TLShapeId) => {
    editor.select(id)
  }

  const toggleLock = (shape: TLShape) => {
    editor.toggleLock([shape.id])
  }

  const bringForward = (id: TLShapeId) => {
    editor.bringForward([id])
  }

  const sendBackward = (id: TLShapeId) => {
    editor.sendBackward([id])
  }

  const bringToFront = (id: TLShapeId) => {
    editor.bringToFront([id])
  }

  const sendToBack = (id: TLShapeId) => {
    editor.sendToBack([id])
  }

  const deleteShape = (id: TLShapeId) => {
    editor.deleteShapes([id])
  }

  const getShapeLabel = (shape: TLShape): string => {
    const props = shape.props as Record<string, any>
    return props.label ?? props.title ?? props.text ?? props.quoteText?.slice(0, 20) ?? shape.type
  }

  const shapeTypeIcons: Record<string, string> = {
    'social-card': '▢', 'quote-card': '❝', 'carousel-slide': '▤',
    'text-overlay': 'T', 'brand-kit': '◆', 'image': '🖼', 'draw': '✎',
    'text': 'A', 'geo': '○', 'arrow': '→', 'note': '📝', 'connector': '⟶',
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Layers</span>
        <span style={{ fontSize: 11, color: '#999' }}>{shapes.length}</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div ref={scrollRef} style={{ overflow: 'auto', maxHeight: 400 }}>
        {shapes.length === 0 && (
          <div style={emptyStyle}>No shapes on canvas</div>
        )}

        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const shape = shapes[virtualItem.index]
            const isSelected = selectedIds.has(shape.id)
            const isLocked = shape.isLocked
            return (
              <div
                key={shape.id}
                onClick={() => selectShape(shape.id)}
                style={{
                  ...layerRowStyle,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualItem.size,
                  transform: `translateY(${virtualItem.start}px)`,
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
                  <IconBtn title="Bring forward" onClick={(e) => { e.stopPropagation(); bringForward(shape.id) }}>↑</IconBtn>
                  <IconBtn title="Send backward" onClick={(e) => { e.stopPropagation(); sendBackward(shape.id) }}>↓</IconBtn>
                  <IconBtn
                    title={isLocked ? 'Unlock' : 'Lock'}
                    onClick={(e) => { e.stopPropagation(); toggleLock(shape) }}
                    active={isLocked}
                  >
                    {isLocked ? '🔒' : '🔓'}
                  </IconBtn>
                  <IconBtn title="Delete" onClick={(e) => { e.stopPropagation(); deleteShape(shape.id) }}>×</IconBtn>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {shapes.length > 1 && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid #eee', display: 'flex', gap: 4 }}>
          <SmallBtn onClick={() => { const ids = editor.getSelectedShapeIds(); if (ids.length > 0) bringToFront(ids[0]) }}>
            To Front
          </SmallBtn>
          <SmallBtn onClick={() => { const ids = editor.getSelectedShapeIds(); if (ids.length > 0) sendToBack(ids[0]) }}>
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
  gap: 6,
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '0 4px',
  marginLeft: 'auto',
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
  boxSizing: 'border-box',
}
