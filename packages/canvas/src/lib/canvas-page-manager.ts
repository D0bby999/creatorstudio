import type { Editor, TLPageId, TLShapeId } from 'tldraw'

/** Page management utilities for canvas multi-page support */

export interface PageInfo {
  id: TLPageId
  name: string
  index: number
}

/** Get all pages from editor */
export function getAllPages(editor: Editor): PageInfo[] {
  const pages = editor.getPages()
  return pages.map((page, index) => ({
    id: page.id,
    name: page.name,
    index,
  }))
}

/** Create a new page */
export function createPage(editor: Editor, name?: string): TLPageId | null {
  const pageName = name || `Page ${editor.getPages().length + 1}`

  try {
    // Use editor API to create unique ID
    const pageId = `page:${Date.now()}` as TLPageId
    editor.store.put([{ id: pageId, typeName: 'page', name: pageName }] as any)
    editor.setCurrentPage(pageId)
    return pageId
  } catch (error) {
    console.error('Failed to create page:', error)
    return null
  }
}

/** Delete a page by ID */
export function deletePage(editor: Editor, pageId: TLPageId): boolean {
  const pages = editor.getPages()

  // Cannot delete if it's the only page
  if (pages.length <= 1) {
    console.warn('Cannot delete the last page')
    return false
  }

  try {
    // Switch to another page before deleting
    const currentPageId = editor.getCurrentPageId()
    if (currentPageId === pageId) {
      const otherPage = pages.find((p) => p.id !== pageId)
      if (otherPage) {
        editor.setCurrentPage(otherPage.id)
      }
    }

    // Use store API to remove page
    editor.store.remove([pageId] as any)
    return true
  } catch (error) {
    console.error('Failed to delete page:', error)
    return false
  }
}

/** Rename a page */
export function renamePage(editor: Editor, pageId: TLPageId, newName: string): void {
  try {
    const page = editor.getPage(pageId)
    if (page) {
      editor.store.put([{ ...page, name: newName }] as any)
    }
  } catch (error) {
    console.error('Failed to rename page:', error)
  }
}

/** Duplicate a page with all its shapes */
export function duplicatePage(editor: Editor, pageId: TLPageId): TLPageId | null {
  try {
    const page = editor.getPage(pageId)
    if (!page) return null

    // Create new page
    const newPageName = `${page.name} (copy)`
    const newPageId = `page:${Date.now()}` as TLPageId
    editor.store.put([{ id: newPageId, typeName: 'page', name: newPageName }] as any)

    // Get all shapes from source page
    const currentPageId = editor.getCurrentPageId()
    editor.setCurrentPage(pageId)
    const shapes = editor.getCurrentPageShapes()

    // Switch to new page and copy shapes
    editor.setCurrentPage(newPageId)

    if (shapes.length > 0) {
      // Duplicate shapes by creating copies with new IDs
      const shapesToCopy = shapes.map((shape, index) => {
        const newId = `shape:${Date.now()}_${index}` as TLShapeId
        return {
          ...shape,
          id: newId,
        }
      })

      editor.createShapes(shapesToCopy as any)
    }

    // Restore original page
    editor.setCurrentPage(currentPageId)

    return newPageId
  } catch (error) {
    console.error('Failed to duplicate page:', error)
    return null
  }
}

/** Move page to new index (reorder) */
export function movePage(editor: Editor, pageId: TLPageId, newIndex: number): void {
  const pages = editor.getPages()
  const currentIndex = pages.findIndex((p) => p.id === pageId)

  if (currentIndex === -1 || newIndex < 0 || newIndex >= pages.length) {
    return
  }

  if (currentIndex === newIndex) {
    return
  }

  // Tldraw doesn't have built-in page reordering via index
  // This is a limitation we'll document
  console.warn('Page reordering not yet supported by tldraw API')
}

/** Get current page info */
export function getCurrentPage(editor: Editor): PageInfo | null {
  const currentPageId = editor.getCurrentPageId()
  const pages = getAllPages(editor)
  return pages.find((p) => p.id === currentPageId) || null
}

/** Switch to page by ID */
export function switchToPage(editor: Editor, pageId: TLPageId): void {
  editor.setCurrentPage(pageId)
}

/** Get page by name */
export function getPageByName(editor: Editor, name: string): PageInfo | null {
  const pages = getAllPages(editor)
  return pages.find((p) => p.name === name) || null
}
