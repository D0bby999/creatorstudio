import type { Editor } from 'tldraw'

export interface PdfExportOptions {
  pageSize?: 'a4' | 'letter' | 'custom'
  orientation?: 'portrait' | 'landscape'
  customWidth?: number
  customHeight?: number
  scale?: number
  background?: boolean
  perFrame?: boolean // If true, export each frame as a separate page
}

/** Export canvas to PDF */
export async function exportToPdf(
  editor: Editor,
  options: PdfExportOptions = {},
): Promise<Blob> {
  const {
    pageSize = 'a4',
    orientation = 'portrait',
    customWidth,
    customHeight,
    scale = 2,
    background = true,
    perFrame = false,
  } = options

  // Dynamic import for tree-shaking
  const { jsPDF } = await import('jspdf')

  // Calculate page dimensions in mm
  let pageWidth: number
  let pageHeight: number

  if (pageSize === 'custom' && customWidth && customHeight) {
    pageWidth = customWidth
    pageHeight = customHeight
  } else if (pageSize === 'letter') {
    pageWidth = orientation === 'portrait' ? 215.9 : 279.4
    pageHeight = orientation === 'portrait' ? 279.4 : 215.9
  } else {
    // A4
    pageWidth = orientation === 'portrait' ? 210 : 297
    pageHeight = orientation === 'portrait' ? 297 : 210
  }

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageSize === 'custom' ? [pageWidth, pageHeight] : pageSize,
  })

  if (perFrame) {
    // Export each frame shape as a separate page
    const frameShapes = editor.getCurrentPageShapes().filter((s) => s.type === 'frame')

    if (frameShapes.length === 0) {
      // No frames, export entire canvas on single page
      await addCanvasPageToPdf(pdf, editor, scale, background, pageWidth, pageHeight, true)
    } else {
      for (let i = 0; i < frameShapes.length; i++) {
        const frame = frameShapes[i]
        if (!frame) continue

        // Select this frame to export it
        editor.setSelectedShapes([frame.id])

        if (i > 0) {
          pdf.addPage()
        }

        await addCanvasPageToPdf(pdf, editor, scale, background, pageWidth, pageHeight, false)
      }

      // Deselect after export
      editor.setSelectedShapes([])
    }
  } else {
    // Export entire canvas or selection as single page
    await addCanvasPageToPdf(pdf, editor, scale, background, pageWidth, pageHeight, true)
  }

  // Convert to blob
  const pdfBlob = pdf.output('blob')
  return pdfBlob
}

/** Add canvas image to PDF page */
async function addCanvasPageToPdf(
  pdf: any,
  editor: Editor,
  scale: number,
  background: boolean,
  pageWidth: number,
  pageHeight: number,
  useAllShapesIfNoneSelected: boolean,
): Promise<void> {
  const selectedIds = editor.getSelectedShapeIds()

  const shapes = selectedIds.length > 0 || !useAllShapesIfNoneSelected
    ? [...selectedIds]
    : [...editor.getCurrentPageShapeIds()]

  if (shapes.length === 0) {
    return
  }

  // Export to PNG blob
  const result = await editor.toImage(shapes, {
    format: 'png',
    scale,
    background,
    padding: 16,
  })

  const blob = result.blob

  // Convert blob to data URL
  const dataUrl = await blobToDataUrl(blob)

  // Get image dimensions to calculate aspect ratio
  const img = await loadImage(dataUrl)
  const imgWidth = img.width
  const imgHeight = img.height

  // Calculate dimensions to fit within PDF page (with some margin)
  const margin = 10 // mm
  const maxWidth = pageWidth - 2 * margin
  const maxHeight = pageHeight - 2 * margin

  let finalWidth = maxWidth
  let finalHeight = (imgHeight / imgWidth) * maxWidth

  if (finalHeight > maxHeight) {
    finalHeight = maxHeight
    finalWidth = (imgWidth / imgHeight) * maxHeight
  }

  // Center image on page
  const x = (pageWidth - finalWidth) / 2
  const y = (pageHeight - finalHeight) / 2

  pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight)
}

/** Convert blob to data URL */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Load image to get dimensions */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = dataUrl
  })
}
