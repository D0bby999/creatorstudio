import { useState, useEffect, useCallback } from 'react'
import type { Editor } from 'tldraw'
import { searchIcons, getIconSvg, ICON_CATEGORIES } from '../lib/element-library/iconify-client'
import { searchWithCache, debounce } from '../lib/element-library/element-search-manager'
import { addRecentElement } from '../lib/element-library/recently-used-elements'

interface ElementLibraryIconsTabProps {
  editor: Editor
  searchQuery: string
}

function sanitizeSvg(svg: string): string {
  let s = svg
  // Remove dangerous elements
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  s = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
  s = s.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
  s = s.replace(/<embed\b[^>]*\/?>/gi, '')
  s = s.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '')
  // Remove event handlers and javascript URIs
  s = s.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  s = s.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
  s = s.replace(/href\s*=\s*["']?\s*javascript\s*:/gi, 'href="')
  s = s.replace(/xlink:href\s*=\s*["']?\s*javascript\s*:/gi, 'xlink:href="')
  // Remove CSS expressions
  s = s.replace(/expression\s*\(/gi, 'blocked(')
  // Remove external use references
  s = s.replace(/<use\b[^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*\/?>/gi, '')
  return s
}

export function ElementLibraryIconsTab({ editor, searchQuery }: ElementLibraryIconsTabProps) {
  const [icons, setIcons] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [iconPreviews, setIconPreviews] = useState<Map<string, string>>(new Map())

  const loadIcons = useCallback(async (query: string) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const finalQuery = selectedCategory ? `${query} ${selectedCategory}` : query
      const cacheKey = `icons:${finalQuery}`
      const result = await searchWithCache(cacheKey, () => searchIcons(finalQuery, 64))

      setIcons(result.icons)

      // Preload icon SVGs for preview
      const newPreviews = new Map<string, string>()
      const loadPromises = result.icons.slice(0, 20).map(async (iconId) => {
        const [prefix, name] = iconId.split(':')
        if (!prefix || !name) return
        try {
          const svg = await getIconSvg(prefix, name)
          newPreviews.set(iconId, svg)
        } catch (e) {
          // Ignore preview load errors
        }
      })
      await Promise.all(loadPromises)
      setIconPreviews(newPreviews)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load icons')
      setIcons([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  // Debounced search on query change
  useEffect(() => {
    const debouncedLoad = debounce(() => {
      loadIcons(searchQuery)
    }, 300)

    debouncedLoad()
  }, [searchQuery, selectedCategory, loadIcons])

  const handleIconClick = async (iconId: string) => {
    const [prefix, name] = iconId.split(':')
    if (!prefix || !name) return

    try {
      const svg = await getIconSvg(prefix, name)
      const sanitized = sanitizeSvg(svg)

      const viewport = editor.getViewportPageBounds()
      const centerX = viewport.x + viewport.width / 2
      const centerY = viewport.y + viewport.height / 2

      // Insert as SVG shape
      editor.putExternalContent({
        type: 'svg-text',
        text: sanitized,
        point: { x: centerX - 24, y: centerY - 24 },
      })

      addRecentElement({
        type: 'icon',
        id: iconId,
        preview: sanitized,
        label: iconId,
      })
    } catch (err) {
      console.error('Failed to insert icon:', err)
    }
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        Error: {error}
      </div>
    )
  }

  if (!searchQuery.trim()) {
    return (
      <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
        Search for icons from Iconify
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category filter */}
      <div style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            width: '100%',
            padding: 6,
            fontSize: 12,
            border: '1px solid #ccc',
            borderRadius: 4,
            backgroundColor: '#fff',
          }}
        >
          <option value="">All categories</option>
          {ICON_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Icons grid */}
      <div style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {icons.map(iconId => {
            const preview = iconPreviews.get(iconId)
            return (
              <div
                key={iconId}
                onClick={() => handleIconClick(iconId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0',
                  backgroundColor: '#fafafa',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
                title={iconId}
              >
                {preview ? (
                  <div dangerouslySetInnerHTML={{ __html: preview }} style={{ width: 32, height: 32 }} />
                ) : (
                  <div style={{ fontSize: 10, color: '#999' }}>...</div>
                )}
              </div>
            )
          })}
        </div>

        {loading && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
            Loading...
          </div>
        )}
      </div>
    </div>
  )
}
