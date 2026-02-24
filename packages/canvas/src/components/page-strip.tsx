import { useState, useEffect, useCallback } from 'react'
import type { Editor, TLPageId } from 'tldraw'
import {
  getAllPages,
  createPage,
  deletePage,
  renamePage,
  duplicatePage,
  canDeletePage,
} from '../lib/page-manager/page-operations'
import { renderPageThumbnail, scheduleThumbnailUpdate } from '../lib/page-manager/page-thumbnail-renderer'

interface PageStripProps {
  editor: Editor
  onClose?: () => void
}

interface PageItem {
  id: TLPageId
  name: string
  thumbnail: string
  isActive: boolean
}

export function PageStrip({ editor }: PageStripProps) {
  const [pages, setPages] = useState<PageItem[]>([])
  const [contextMenu, setContextMenu] = useState<{
    pageId: TLPageId
    x: number
    y: number
  } | null>(null)
  const [renaming, setRenaming] = useState<TLPageId | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const refreshPages = useCallback(async () => {
    const allPages = getAllPages(editor)
    const currentPageId = editor.getCurrentPageId()

    const pageItems = await Promise.all(
      allPages.map(async (page) => {
        const thumbnail = await renderPageThumbnail(editor, page.id, 80)
        return {
          id: page.id,
          name: page.name,
          thumbnail,
          isActive: page.id === currentPageId,
        }
      }),
    )

    setPages(pageItems)
  }, [editor])

  // Initial load
  useEffect(() => {
    refreshPages()
  }, [refreshPages])

  // Listen for page changes
  useEffect(() => {
    const handlePageChange = () => {
      refreshPages()
    }

    // Listen to page changes via store
    const dispose = editor.store.listen(() => {
      handlePageChange()
    }, { scope: 'document' })

    return () => {
      dispose()
    }
  }, [editor, refreshPages])

  // Schedule thumbnail updates on shape changes
  useEffect(() => {
    const dispose = editor.store.listen(() => {
      const currentPageId = editor.getCurrentPageId()
      scheduleThumbnailUpdate(editor, currentPageId, 500)
    }, { scope: 'document' })

    return () => {
      dispose()
    }
  }, [editor])

  const handleAddPage = () => {
    createPage(editor)
    refreshPages()
  }

  const handlePageClick = (pageId: TLPageId) => {
    editor.setCurrentPage(pageId)
    refreshPages()
  }

  const handleContextMenu = (e: React.MouseEvent, pageId: TLPageId) => {
    e.preventDefault()
    setContextMenu({ pageId, x: e.clientX, y: e.clientY })
  }

  const handleRename = (pageId: TLPageId) => {
    const page = pages.find((p) => p.id === pageId)
    if (page) {
      setRenaming(pageId)
      setRenameValue(page.name)
    }
    setContextMenu(null)
  }

  const handleRenameSubmit = () => {
    if (renaming && renameValue.trim()) {
      renamePage(editor, renaming, renameValue.trim())
      refreshPages()
    }
    setRenaming(null)
    setRenameValue('')
  }

  const handleDuplicate = (pageId: TLPageId) => {
    duplicatePage(editor, pageId)
    refreshPages()
    setContextMenu(null)
  }

  const handleDelete = (pageId: TLPageId) => {
    if (canDeletePage(editor)) {
      deletePage(editor, pageId)
      refreshPages()
    }
    setContextMenu(null)
  }

  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => setContextMenu(null)
      window.addEventListener('click', handleClick)
      return () => window.removeEventListener('click', handleClick)
    }
  }, [contextMenu])

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-white shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto p-2">
          {/* Page thumbnails */}
          {pages.map((page) => (
            <div
              key={page.id}
              className={`group relative flex shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:bg-gray-50 ${
                page.isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => handlePageClick(page.id)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
            >
              {/* Thumbnail */}
              <div className="h-20 w-20 overflow-hidden rounded border bg-gray-100">
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={page.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">
                    📄
                  </div>
                )}
              </div>

              {/* Page name */}
              {renaming === page.id ? (
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className="w-20 rounded border px-1 py-0.5 text-xs"
                  autoFocus
                />
              ) : (
                <span className="w-20 truncate text-center text-xs font-medium">
                  {page.name}
                </span>
              )}
            </div>
          ))}

          {/* Add page button */}
          <button
            onClick={handleAddPage}
            className="flex h-28 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-all hover:border-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">+</span>
            <span className="text-xs">Add Page</span>
          </button>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 rounded-lg border bg-white shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleRename(contextMenu.pageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Rename
          </button>
          <button
            onClick={() => handleDuplicate(contextMenu.pageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Duplicate
          </button>
          {canDeletePage(editor) && (
            <button
              onClick={() => handleDelete(contextMenu.pageId)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </>
  )
}
