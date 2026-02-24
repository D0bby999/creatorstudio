/**
 * Illustrations tab for Element Library panel
 * Category filter + search + grid of multi-path SVG illustrations
 */

import { useState, useMemo } from 'react'
import type { Editor } from 'tldraw'
import {
  getAllIllustrations,
  getIllustrationsByCategory,
  searchIllustrations,
  ILLUSTRATION_CATEGORIES,
  type IllustrationCategory,
  type IllustrationDefinition,
} from '../lib/element-library/illustration-data-index'
import { sanitizeSvgContent } from '../lib/element-library/svg-sanitizer'
import { addRecentElement } from '../lib/element-library/recently-used-elements'

interface ElementLibraryIllustrationsTabProps {
  editor: Editor
  searchQuery: string
}

export function ElementLibraryIllustrationsTab({ editor, searchQuery }: ElementLibraryIllustrationsTabProps) {
  const [category, setCategory] = useState<IllustrationCategory | 'all'>('all')

  const illustrations = useMemo(() => {
    let items: IllustrationDefinition[]
    if (searchQuery.trim()) {
      items = searchIllustrations(searchQuery)
    } else if (category === 'all') {
      items = getAllIllustrations()
    } else {
      items = getIllustrationsByCategory(category)
    }
    return items
  }, [searchQuery, category])

  const handleClick = (illust: IllustrationDefinition) => {
    const pathsStr = illust.paths.map(p => {
      const attrs = [`d="${p.d}"`]
      if (p.fill) attrs.push(`fill="${p.fill}"`)
      if (p.stroke) attrs.push(`stroke="${p.stroke}"`)
      if (p.strokeWidth) attrs.push(`stroke-width="${p.strokeWidth}"`)
      return `<path ${attrs.join(' ')}/>`
    }).join('')

    const svgString = `<svg viewBox="${illust.viewBox}" xmlns="http://www.w3.org/2000/svg">${pathsStr}</svg>`
    const sanitized = sanitizeSvgContent(svgString)

    const viewport = editor.getViewportPageBounds()
    const centerX = viewport.x + viewport.width / 2
    const centerY = viewport.y + viewport.height / 2

    editor.putExternalContent({
      type: 'svg-text',
      text: sanitized,
      point: { x: centerX - 48, y: centerY - 48 },
    })

    addRecentElement({
      type: 'icon',
      id: illust.id,
      preview: sanitized,
      label: illust.label,
    })
  }

  return (
    <div style={{ padding: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
      {/* Category filter */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as any)}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 12,
          border: '1px solid #ccc',
          borderRadius: 4,
          marginBottom: 8,
          outline: 'none',
        }}
      >
        <option value="all">All Categories</option>
        {ILLUSTRATION_CATEGORIES.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.label}</option>
        ))}
      </select>

      {illustrations.length === 0 ? (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
          No illustrations found
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {illustrations.map(illust => (
            <div
              key={illust.id}
              onClick={() => handleClick(illust)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: 8,
                borderRadius: 4,
                border: '1px solid #e0e0e0',
                backgroundColor: '#fafafa',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fafafa' }}
              title={illust.label}
            >
              <svg width="64" height="64" viewBox={illust.viewBox}>
                {illust.paths.map((p, i) => (
                  <path
                    key={i}
                    d={p.d}
                    fill={p.fill ?? 'none'}
                    stroke={p.stroke ?? 'none'}
                    strokeWidth={p.strokeWidth}
                  />
                ))}
              </svg>
              <div style={{ fontSize: 9, color: '#666', textAlign: 'center', lineHeight: 1.2 }}>
                {illust.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
