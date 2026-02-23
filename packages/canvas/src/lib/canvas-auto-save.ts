import type { Editor } from 'tldraw'

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

export interface AutoSaveOptions {
  debounceMs?: number
  onSave: (snapshot: any) => Promise<void>
  onStatusChange: (status: SaveStatus) => void
  onVersionMilestone?: (snapshot: any) => void
}

export function createAutoSave(editor: Editor, options: AutoSaveOptions) {
  const { debounceMs = 30000, onSave, onStatusChange, onVersionMilestone } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let saveCount = 0
  let destroyed = false

  const markUnsaved = () => {
    if (destroyed) return
    onStatusChange('unsaved')
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => doSave(), debounceMs)
  }

  const doSave = async () => {
    if (destroyed) return
    onStatusChange('saving')
    try {
      const snapshot = editor.store.getStoreSnapshot()
      await onSave(snapshot)
      saveCount++
      onStatusChange('saved')
      if (saveCount % 5 === 0 && onVersionMilestone) {
        onVersionMilestone(snapshot)
      }
    } catch {
      onStatusChange('error')
      if (!destroyed) {
        retryTimer = setTimeout(() => doSave(), 10000)
      }
    }
  }

  const cleanup = editor.sideEffects.registerAfterChangeHandler('shape', () => {
    markUnsaved()
  })

  const destroy = () => {
    destroyed = true
    if (timer) clearTimeout(timer)
    if (retryTimer) clearTimeout(retryTimer)
    cleanup()
  }

  const saveNow = async () => {
    if (timer) clearTimeout(timer)
    await doSave()
  }

  return { destroy, saveNow }
}
