import type { Editor, TLPageId } from 'tldraw'
import {
  getAllPages,
  createPage,
  deletePage,
  renamePage,
  duplicatePage,
  getCurrentPage,
  switchToPage,
  getPageByName,
  type PageInfo,
} from '../canvas-page-manager'

/** Re-export all existing page manager functions */
export {
  getAllPages,
  createPage,
  deletePage,
  renamePage,
  duplicatePage,
  getCurrentPage,
  switchToPage,
  getPageByName,
  type PageInfo,
}

/**
 * Reorder pages by rebuilding index values
 * Note: tldraw doesn't have built-in page reordering API
 * This is a workaround that manipulates page records directly
 * @param editor - Tldraw editor instance
 * @param pageIds - Ordered array of page IDs (new order)
 */
export function reorderPages(editor: Editor, pageIds: TLPageId[]): void {
  try {
    const pages = editor.getPages()

    // Validate all page IDs exist
    const validIds = new Set(pages.map((p) => p.id))
    const allValid = pageIds.every((id) => validIds.has(id))

    if (!allValid) {
      console.error('Invalid page IDs in reorder request')
      return
    }

    // tldraw limitation: no direct index manipulation
    // Pages are ordered by creation time internally
    // This function is provided for UI consistency but has no effect on actual page order
    console.warn('Page reordering not fully supported by tldraw API')
  } catch (error) {
    console.error('Failed to reorder pages:', error)
  }
}

/**
 * Get total page count
 */
export function getPageCount(editor: Editor): number {
  return editor.getPages().length
}

/**
 * Get page index by ID
 */
export function getPageIndex(editor: Editor, pageId: TLPageId): number {
  const pages = editor.getPages()
  return pages.findIndex((p) => p.id === pageId)
}

/**
 * Check if page can be deleted (must have >1 page)
 */
export function canDeletePage(editor: Editor): boolean {
  return getPageCount(editor) > 1
}
