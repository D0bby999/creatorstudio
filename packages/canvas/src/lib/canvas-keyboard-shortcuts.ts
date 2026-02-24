import type { Editor } from 'tldraw'

export interface CanvasShortcutCallbacks {
  onSave?: () => void
  onExport?: () => void
  onToggleLayers?: () => void
  onToggleInspector?: () => void
  onToggleRulers?: () => void
  onToggleGuides?: () => void
  onToolChange?: (toolId: string) => void
  onStyleCopy?: () => void
  onStylePaste?: () => void
}

/**
 * Tool-switch shortcuts: single key, no modifiers, guarded against text editing focus.
 * NOTE: tldraw 4.3.1 internally registers shortcuts for all built-in tools via hotkeys-js:
 *   v=select, h=hand, e=eraser, k=laser, z=zoom, d/b/x=draw, r=geo(rect), o=geo(ellipse),
 *   a=arrow, l=line, f=frame, t=text, n=note, shift+d=highlight
 * We only register shortcuts for our CUSTOM tools here to avoid double-fire.
 */
const TOOL_SHORTCUTS: Record<string, string> = {
  c: 'connector',
}

function isEditingText(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if ((el as HTMLElement).contentEditable === 'true') return true
  return false
}

export function registerCanvasShortcuts(
  editor: Editor,
  callbacks: CanvasShortcutCallbacks,
): () => void {
  const handler = (e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey

    // Modifier-based shortcuts (Cmd/Ctrl combos)
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
    if (meta && e.altKey && e.key === 'c') {
      e.preventDefault()
      callbacks.onStyleCopy?.()
      return
    }
    if (meta && e.altKey && e.key === 'v') {
      e.preventDefault()
      callbacks.onStylePaste?.()
      return
    }
    if (meta && e.key === 'r') {
      e.preventDefault()
      callbacks.onToggleRulers?.()
      return
    }
    if (meta && e.key === ';') {
      e.preventDefault()
      callbacks.onToggleGuides?.()
      return
    }

    // Tool-switch shortcuts: single key, no modifiers
    if (!meta && !e.shiftKey && !e.altKey) {
      if (isEditingText()) return
      const toolId = TOOL_SHORTCUTS[e.key.toLowerCase()]
      if (toolId) {
        editor.setCurrentTool(toolId)
        callbacks.onToolChange?.(toolId)
        return
      }
    }
  }

  window.addEventListener('keydown', handler)
  return () => window.removeEventListener('keydown', handler)
}
