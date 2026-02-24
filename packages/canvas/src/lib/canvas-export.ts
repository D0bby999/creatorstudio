import type { Editor } from 'tldraw'
import type { ImageMeta } from './image-filters/image-adjustment-types'
import { bakeFiltersToCanvas } from './image-filters/image-filter-engine'

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

  const shapes = selectedIds.length > 0
    ? selectedIds
    : editor.getCurrentPageShapeIds()

  // Find enhanced-image shapes with filters and temporarily bake them
  const enhancedImageShapes = [...shapes]
    .map(id => editor.getShape(id))
    .filter(shape => shape?.type === 'enhanced-image')
    .filter(shape => {
      const meta = (shape.meta || {}) as ImageMeta
      return meta.imageFilters && Object.keys(meta.imageFilters).length > 0
    })

  const originalSrcs: Record<string, string> = {}

  // Bake filters to data URLs
  for (const shape of enhancedImageShapes) {
    const meta = (shape.meta || {}) as ImageMeta
    const props = shape.props as any

    if (!meta.imageFilters || !props.src) continue

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = props.src
      })

      const bakedCanvas = await bakeFiltersToCanvas(img, meta.imageFilters)
      const dataUrl = bakedCanvas.toDataURL('image/png')

      // Store original and swap
      originalSrcs[shape.id] = props.src
      editor.updateShapes([{
        id: shape.id,
        type: 'enhanced-image',
        props: { src: dataUrl },
      }])
    } catch (error) {
      console.warn('Failed to bake filters for shape', shape.id, error)
    }
  }

  // Small delay to ensure React render
  await new Promise(resolve => setTimeout(resolve, 100))

  const result = await editor.toImage([...shapes], {
    format,
    scale,
    background,
    padding,
  })

  // Restore original sources
  for (const shapeId of Object.keys(originalSrcs)) {
    editor.updateShapes([{
      id: shapeId as any,
      type: 'enhanced-image',
      props: { src: originalSrcs[shapeId] },
    }])
  }

  return result.blob
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
