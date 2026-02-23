import type { Editor } from 'tldraw'

export interface CanvasShortcutCallbacks {
  onSave?: () => void
  onExport?: () => void
  onToggleLayers?: () => void
  onToggleInspector?: () => void
}

export function registerCanvasShortcuts(
  editor: Editor,
  callbacks: CanvasShortcutCallbacks,
): () => void {
  const handler = (e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey

    if (meta && e.key === 's') {
      e.preventDefault()
      callbacks.onSave?.()
      return
    }
    if (meta && e.key === 'e') {
      e.preventDefault()
      callbacks.onExport?.()
      return
    }
    if (meta && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      callbacks.onToggleLayers?.()
      return
    }
    if (meta && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      callbacks.onToggleInspector?.()
      return
    }
    if (meta && e.key === 'd') {
      e.preventDefault()
      const ids = editor.getSelectedShapeIds()
      if (ids.length > 0) editor.duplicateShapes(ids)
      return
    }
    if (meta && !e.shiftKey && e.key === 'g') {
      e.preventDefault()
      const ids = editor.getSelectedShapeIds()
      if (ids.length > 1) editor.groupShapes(ids)
      return
    }
    if (meta && e.shiftKey && e.key.toLowerCase() === 'g') {
      e.preventDefault()
      const ids = editor.getSelectedShapeIds()
      if (ids.length > 0) editor.ungroupShapes(ids)
      return
    }
  }

  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
