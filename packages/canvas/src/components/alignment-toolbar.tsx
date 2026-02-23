import { useState, useEffect } from 'react'
import type { Editor } from 'tldraw'

interface AlignmentToolbarProps {
  editor: Editor
}

export function AlignmentToolbar({ editor }: AlignmentToolbarProps) {
  const [selectedCount, setSelectedCount] = useState(0)

  useEffect(() => {
    const update = () => setSelectedCount(editor.getSelectedShapeIds().length)
    update()
    const unsub = editor.store.listen(update, { scope: 'document' })
    return () => unsub()
  }, [editor])

  if (selectedCount < 2) return null

  const ids = () => editor.getSelectedShapeIds()

  return (
    <div style={containerStyle}>
      <AlignBtn title="Align left" onClick={() => editor.alignShapes(ids(), 'left')}>⫷</AlignBtn>
      <AlignBtn title="Align center H" onClick={() => editor.alignShapes(ids(), 'center-horizontal')}>⫿</AlignBtn>
      <AlignBtn title="Align right" onClick={() => editor.alignShapes(ids(), 'right')}>⫸</AlignBtn>
      <div style={separatorStyle} />
      <AlignBtn title="Align top" onClick={() => editor.alignShapes(ids(), 'top')}>⫠</AlignBtn>
      <AlignBtn title="Align center V" onClick={() => editor.alignShapes(ids(), 'center-vertical')}>⫟</AlignBtn>
      <AlignBtn title="Align bottom" onClick={() => editor.alignShapes(ids(), 'bottom')}>⫡</AlignBtn>
      {selectedCount >= 3 && (
        <>
          <div style={separatorStyle} />
          <AlignBtn title="Distribute H" onClick={() => editor.distributeShapes(ids(), 'horizontal')}>⫦</AlignBtn>
          <AlignBtn title="Distribute V" onClick={() => editor.distributeShapes(ids(), 'vertical')}>⫧</AlignBtn>
        </>
      )}
    </div>
  )
}

function AlignBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title} style={btnStyle}>
      {children}
    </button>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  display: 'flex',
  gap: 2,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: '4px 6px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  border: '1px solid var(--color-border, #e5e5e5)',
}

const btnStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
  background: 'transparent',
  borderRadius: 4,
  color: '#555',
  lineHeight: 1,
}

const separatorStyle: React.CSSProperties = {
  width: 1,
  background: '#e0e0e0',
  margin: '2px 4px',
}
