import { useState, useMemo } from 'react'
import type { Editor } from 'tldraw'
import { canvasTemplates, type CanvasTemplate } from '../templates/canvas-templates'
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '../templates/canvas-template-categories'
import { enrichTemplates, searchTemplates } from '../templates/canvas-template-search'
import {
  toggleFavoriteTemplate,
  isTemplateFavorite,
  filterFavoriteTemplates,
} from '../templates/canvas-template-favorites'

interface TemplatePanelProps {
  editor: Editor
  onClose: () => void
}

/** Panel for selecting and applying canvas templates */
export function TemplatePanel({ editor, onClose }: TemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all' | 'favorites'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('canvas-template-favorites')
        return stored ? JSON.parse(stored) : []
      } catch {
        return []
      }
    }
    return []
  })

  const enrichedTemplates = useMemo(() => enrichTemplates(canvasTemplates), [])

  const filteredTemplates = useMemo(() => {
    let results = enrichedTemplates

    // Filter by favorites
    if (selectedCategory === 'favorites') {
      results = filterFavoriteTemplates(results)
    }
    // Filter by category
    else if (selectedCategory !== 'all') {
      results = searchTemplates(results, { category: selectedCategory })
    }

    // Apply search query
    if (searchQuery.trim()) {
      results = searchTemplates(results, {
        query: searchQuery,
        category: selectedCategory !== 'all' && selectedCategory !== 'favorites' ? selectedCategory : undefined,
      })
    }

    return results
  }, [enrichedTemplates, selectedCategory, searchQuery])

  const applyTemplate = (template: CanvasTemplate) => {
    // Create a social-card shape as the artboard background
    editor.createShape({
      type: 'social-card',
      x: 0,
      y: 0,
      props: {
        w: template.width,
        h: template.height,
        label: template.name,
        platform: template.category.toLowerCase(),
        backgroundColor: '#ffffff',
      },
    } as any)

    // Zoom to fit the new shape
    editor.zoomToFit({ animation: { duration: 300 } })
    onClose()
  }

  const handleToggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavoriteTemplate(templateId)
    // Update local state to trigger re-render
    setFavorites(isTemplateFavorite(templateId) ? favorites.filter((id) => id !== templateId) : [...favorites, templateId])
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Templates</span>
        <button onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
      </div>

      {/* Search input */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {/* Category tabs */}
      <div style={tabsContainerStyle}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={selectedCategory === 'all' ? activeTabStyle : tabStyle}
        >
          All
        </button>
        <button
          onClick={() => setSelectedCategory('favorites')}
          style={selectedCategory === 'favorites' ? activeTabStyle : tabStyle}
        >
          ❤️ Favorites
        </button>
        {TEMPLATE_CATEGORIES.filter((c) => c.id !== 'blank').map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={selectedCategory === cat.id ? activeTabStyle : tabStyle}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div style={{ overflow: 'auto', maxHeight: 400, padding: '8px 12px' }}>
        {filteredTemplates.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            {selectedCategory === 'favorites' ? 'No favorites yet' : 'No templates found'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {filteredTemplates.map((t) => {
              const isFav = isTemplateFavorite(t.id)
              return (
                <button key={t.id} onClick={() => applyTemplate(t)} style={templateCardStyle}>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: `${t.width}/${t.height}`,
                        maxHeight: 60,
                        background: '#f5f5f5',
                        borderRadius: 4,
                        border: '1px dashed #ddd',
                        marginBottom: 4,
                      }}
                    />
                    <button
                      onClick={(e) => handleToggleFavorite(t.id, e)}
                      style={favoriteButtonStyle}
                      aria-label="Toggle favorite"
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: '#999' }}>
                    {t.width} × {t.height}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  width: 320,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  border: '1px solid #e5e5e5',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '0 4px',
}

const templateCardStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: '1px solid #eee',
  background: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'border-color 0.15s',
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
}

const tabsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
}

const tabStyle: React.CSSProperties = {
  padding: '4px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  background: '#fff',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 500,
  transition: 'all 0.15s',
}

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: '#000',
  color: '#fff',
  borderColor: '#000',
}

const favoriteButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  background: 'rgba(255,255,255,0.9)',
  border: 'none',
  borderRadius: 4,
  width: 24,
  height: 24,
  cursor: 'pointer',
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}
