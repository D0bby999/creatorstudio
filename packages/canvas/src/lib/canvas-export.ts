import type { Editor } from 'tldraw'

export type ExportFormat = 'png' | 'svg' | 'webp' | 'jpeg'

export interface ExportOptions {
  format: ExportFormat
  scale?: number
  background?: boolean
  padding?: number
}

/** Export the entire canvas or selected shapes to an image blob */
export async function exportCanvas(editor: Editor, options: ExportOptions): Promise<Blob> {
  const { format, scale = 2, background = true, padding = 16 } = options
  const selectedIds = editor.getSelectedShapeIds()

  const blob = await editor.toImage({
    format,
    scale,
    background,
    padding,
    // Export selected shapes if any, otherwise all
    ...(selectedIds.length > 0 ? { ids: [...selectedIds] } : {}),
  })

  return blob
}

/** Download a blob as a file */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Export and immediately download */
export async function exportAndDownload(
  editor: Editor,
  filename: string,
  options: ExportOptions,
) {
  const blob = await exportCanvas(editor, options)
  downloadBlob(blob, filename)
}
