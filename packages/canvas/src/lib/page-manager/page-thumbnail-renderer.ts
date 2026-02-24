import type { Editor, TLPageId } from 'tldraw'

/** Thumbnail cache with data URLs */
const thumbnailCache = new Map<TLPageId, string>()

/** Debounced thumbnail update timers */
const updateTimers = new Map<TLPageId, NodeJS.Timeout>()

/**
 * Render page thumbnail by switching to page, capturing toImage, then switching back
 * @param editor - Tldraw editor instance
 * @param pageId - Target page ID
 * @param size - Thumbnail width/height (square)
 * @returns Data URL of thumbnail
 */
export async function renderPageThumbnail(
  editor: Editor,
  pageId: TLPageId,
  size = 120,
): Promise<string> {
  // Check cache first
  const cached = thumbnailCache.get(pageId)
  if (cached) {
    return cached
  }

  const currentPageId = editor.getCurrentPageId()
  const isCurrentPage = currentPageId === pageId

  try {
    // Switch to target page if not current
    if (!isCurrentPage) {
      editor.setCurrentPage(pageId)
    }

    // Get all shapes on this page
    const shapes = editor.getCurrentPageShapes()
    if (shapes.length === 0) {
      // Empty page - return placeholder
      const placeholder = createEmptyThumbnail(size)
      thumbnailCache.set(pageId, placeholder)
      return placeholder
    }

    // Render page to image
    const result = await editor.toImage(shapes.map(s => s.id), {
      format: 'png',
      padding: 16,
      scale: size / 800, // Scale down from default canvas size
    })

    if (!result || !result.blob) {
      throw new Error('Failed to generate thumbnail')
    }

    // Convert blob to data URL
    const dataUrl = await blobToDataUrl(result.blob)

    // Cache result
    thumbnailCache.set(pageId, dataUrl)

    return dataUrl
  } catch (error) {
    console.error(`Failed to render thumbnail for page ${pageId}:`, error)
    const fallback = createEmptyThumbnail(size)
    thumbnailCache.set(pageId, fallback)
    return fallback
  } finally {
    // Restore original page if we switched
    if (!isCurrentPage) {
      editor.setCurrentPage(currentPageId)
    }
  }
}

/**
 * Schedule debounced thumbnail update for page
 * @param editor - Tldraw editor
 * @param pageId - Page to update
 * @param delayMs - Debounce delay (default 500ms)
 */
export function scheduleThumbnailUpdate(
  editor: Editor,
  pageId: TLPageId,
  delayMs = 500,
): void {
  // Clear existing timer
  const existingTimer = updateTimers.get(pageId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  // Schedule new update
  const timer = setTimeout(() => {
    invalidateThumbnail(pageId)
    renderPageThumbnail(editor, pageId).catch((err) => {
      console.error('Thumbnail update failed:', err)
    })
    updateTimers.delete(pageId)
  }, delayMs)

  updateTimers.set(pageId, timer)
}

/**
 * Invalidate cached thumbnail for page
 */
export function invalidateThumbnail(pageId: TLPageId): void {
  thumbnailCache.delete(pageId)
}

/**
 * Clear all thumbnail caches and timers
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear()
  updateTimers.forEach((timer) => clearTimeout(timer))
  updateTimers.clear()
}

/**
 * Convert Blob to data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Create empty page placeholder thumbnail
 */
function createEmptyThumbnail(size: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return ''
  }

  // Draw gray background
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, size, size)

  // Draw placeholder icon
  ctx.fillStyle = '#999'
  ctx.font = `${size / 3}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('📄', size / 2, size / 2)

  return canvas.toDataURL('image/png')
}
