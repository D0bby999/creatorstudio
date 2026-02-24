import { useState } from 'react'
import type { Editor } from 'tldraw'
import { ElementLibraryPhotosTab } from './element-library-photos-tab'
import { ElementLibraryIconsTab } from './element-library-icons-tab'
import { ElementLibraryShapesTab } from './element-library-shapes-tab'
import { ElementLibraryIllustrationsTab } from './element-library-illustrations-tab'
import { getRecentElements, clearRecent } from '../lib/element-library/recently-used-elements'
import { sanitizeSvgContent } from '../lib/element-library/svg-sanitizer'

interface ElementLibraryPanelProps {
  editor: Editor
  onClose: () => void
  unsplashEndpoint?: string
}

type TabType = 'photos' | 'icons' | 'illustrations' | 'shapes' | 'recent'

export function ElementLibraryPanel({ editor, onClose, unsplashEndpoint }: ElementLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('photos')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentElements, setRecentElements] = useState(() => getRecentElements())

  const handleClearRecent = () => {
    clearRecent()
    setRecentElements([])
  }

  const handleRecentClick = (element: ReturnType<typeof getRecentElements>[0]) => {
    const viewport = editor.getViewportPageBounds()
    const centerX = viewport.x + viewport.width / 2
    const centerY = viewport.y + viewport.height / 2

    if (element.type === 'photo') {
      editor.createShape({
        type: 'enhanced-image',
        x: centerX - 200,
        y: centerY - 150,
        props: {
          w: 400,
          h: 300,
          src: element.preview,
          assetId: `recent-${element.id}`,
        },
      })
    } else if (element.type === 'icon' || element.type === 'shape') {
      editor.putExternalContent({
        type: 'svg-text',
        text: element.preview,
        point: { x: centerX - 24, y: centerY - 24 },
      })
    }
  }

  const tabs: { id: TabType; label: string; hidden?: boolean }[] = [
    { id: 'photos', label: 'Photos', hidden: !unsplashEndpoint },
    { id: 'icons', label: 'Icons' },
    { id: 'illustrations', label: 'Illustr.' },
    { id: 'shapes', label: 'Shapes' },
    { id: 'recent', label: 'Recent' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        left: 8,
        zIndex: 300,
        width: 320,
        maxHeight: 'calc(100vh - 64px)',
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: 12, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Element Library</div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: '#666',
            padding: 0,
            width: 24,
            height: 24,
          }}
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', padding: '0 8px' }}>
        {tabs.filter(t => !t.hidden).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#000' : '#666',
              borderBottom: activeTab === tab.id ? '2px solid #000' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar (photos & icons only) */}
      {(activeTab === 'photos' || activeTab === 'icons' || activeTab === 'illustrations') && (
        <div style={{ padding: 8, borderBottom: '1px solid #e0e0e0' }}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              fontSize: 12,
              border: '1px solid #ccc',
              borderRadius: 4,
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'photos' && unsplashEndpoint && (
          <ElementLibraryPhotosTab editor={editor} searchQuery={searchQuery} />
        )}
        {activeTab === 'icons' && (
          <ElementLibraryIconsTab editor={editor} searchQuery={searchQuery} />
        )}
        {activeTab === 'illustrations' && (
          <ElementLibraryIllustrationsTab editor={editor} searchQuery={searchQuery} />
        )}
        {activeTab === 'shapes' && (
          <ElementLibraryShapesTab editor={editor} />
        )}
        {activeTab === 'recent' && (
          <div style={{ padding: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            {recentElements.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
                No recent elements
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleClearRecent}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      border: '1px solid #ccc',
                      borderRadius: 4,
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {recentElements.map(element => (
                    <div
                      key={`${element.type}-${element.id}`}
                      onClick={() => handleRecentClick(element)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0',
                        aspectRatio: '1',
                        backgroundColor: '#fafafa',
                      }}
                      title={element.label}
                    >
                      {element.type === 'photo' ? (
                        <img src={element.preview} alt={element.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: sanitizeSvgContent(element.preview) }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }} />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
