import type { Editor } from 'tldraw'
import { downloadBlob, type ExportFormat } from './canvas-export'

export interface BatchExportOptions {
  format: ExportFormat
  scale?: number
  background?: boolean
  onProgress?: (current: number, total: number) => void
}

export async function batchExport(editor: Editor, options: BatchExportOptions): Promise<number> {
  const { format, scale = 2, background = true, onProgress } = options

  const socialCards = editor.getCurrentPageShapes().filter((s) => (s.type as string) === 'social-card')
  if (socialCards.length === 0) return 0

  for (let i = 0; i < socialCards.length; i++) {
    const shape = socialCards[i]
    const props = shape.props as Record<string, any>
    onProgress?.(i + 1, socialCards.length)

    const result = await editor.toImage([shape.id], {
      format,
      scale,
      background,
      padding: 0,
    })

    const label = props.label || `shape-${i + 1}`
    const filename = `${label}-${props.w}x${props.h}.${format}`
    downloadBlob(result.blob, filename)

    // Small delay between downloads to prevent browser throttling
    if (i < socialCards.length - 1) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  return socialCards.length
}
