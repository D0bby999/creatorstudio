import type { Editor, TLShapeId } from 'tldraw'

export type CopyFormat = 'png' | 'svg' | 'json'

/** Copy selection to clipboard in specified format */
export async function copyAs(editor: Editor, format: CopyFormat): Promise<void> {
  const selectedIds = editor.getSelectedShapeIds()

  if (selectedIds.length === 0) {
    throw new Error('No shapes selected')
  }

  switch (format) {
    case 'png':
      await copyAsPng(editor, selectedIds)
      break
    case 'svg':
      await copyAsSvg(editor, selectedIds)
      break
    case 'json':
      await copyAsJson(editor, selectedIds)
      break
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/** Copy selection as PNG image */
async function copyAsPng(editor: Editor, shapeIds: TLShapeId[]): Promise<void> {
  const result = await editor.toImage([...shapeIds], {
    format: 'png',
    scale: 2,
    background: false,
    padding: 16,
  })

  const clipboardItem = new ClipboardItem({
    [result.blob.type]: result.blob,
  })

  await navigator.clipboard.write([clipboardItem])
}

/** Copy selection as SVG text */
async function copyAsSvg(editor: Editor, shapeIds: TLShapeId[]): Promise<void> {
  const result = await editor.toImage([...shapeIds], {
    format: 'svg',
    scale: 1,
    background: false,
    padding: 16,
  })

  const svgText = await result.blob.text()

  // Try ClipboardItem first for better browser support
  if (typeof ClipboardItem !== 'undefined') {
    try {
      const clipboardItem = new ClipboardItem({
        'text/plain': new Blob([svgText], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([clipboardItem])
      return
    } catch {
      // Fall through to writeText
    }
  }

  await navigator.clipboard.writeText(svgText)
}

/** Copy selection as JSON */
async function copyAsJson(editor: Editor, shapeIds: TLShapeId[]): Promise<void> {
  const shapes = shapeIds.map((id) => editor.getShape(id)).filter(Boolean)

  const json = JSON.stringify(shapes, null, 2)

  await navigator.clipboard.writeText(json)
}
