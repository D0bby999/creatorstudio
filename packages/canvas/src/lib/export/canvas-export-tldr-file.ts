import type { Editor } from 'tldraw'

/** Save canvas snapshot to .tldr file blob */
export function saveTldrFile(editor: Editor): Blob {
  const snapshot = editor.store.getStoreSnapshot()
  const json = JSON.stringify(snapshot, null, 2)
  return new Blob([json], { type: 'application/json' })
}

/** Download canvas as .tldr file */
export function downloadTldrFile(editor: Editor, filename?: string): void {
  const blob = saveTldrFile(editor)
  const timestamp = new Date().toISOString().slice(0, 10)
  const name = filename ?? `canvas-${timestamp}.tldr`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Load .tldr file into canvas */
export async function loadTldrFile(editor: Editor, file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const text = reader.result as string
        const snapshot = JSON.parse(text)

        // Validate basic structure
        if (!snapshot || typeof snapshot !== 'object') {
          throw new Error('Invalid .tldr file format')
        }

        // Load snapshot into editor
        ;(editor.store as any).loadSnapshot(snapshot)
        resolve()
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
