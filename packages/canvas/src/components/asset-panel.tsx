import { useState, useEffect, useCallback } from 'react'
import type { Editor } from 'tldraw'

interface AssetFile {
  key: string
  filename: string
  size: number
  url: string
}

interface AssetPanelProps {
  editor: Editor
  onClose: () => void
  assetsEndpoint: string
}

export function AssetPanel({ editor, onClose, assetsEndpoint }: AssetPanelProps) {
  const [assets, setAssets] = useState<AssetFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(assetsEndpoint)
      if (res.ok) {
        const data = await res.json()
        setAssets(data.files ?? [])
      }
    } catch {
      // R2 not configured — empty list is fine
    } finally {
      setLoading(false)
    }
  }, [assetsEndpoint])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleInsert = (asset: AssetFile) => {
    const { x, y } = editor.getViewportPageBounds().center
    editor.createShape({
      type: 'image' as any,
      x: x - 200,
      y: y - 200,
      props: { w: 400, h: 400, src: asset.url },
    })
  }

  const handleDelete = async (key: string) => {
    try {
      await fetch(assetsEndpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      setAssets((prev: AssetFile[]) => prev.filter((a: AssetFile) => a.key !== key))
    } catch {
      // silent fail
    }
  }

  const filtered = search
    ? assets.filter((a: AssetFile) => a.filename.toLowerCase().includes(search.toLowerCase()))
    : assets

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Assets</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div style={{ padding: '8px 12px' }}>
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchStyle}
        />
      </div>

      <div style={{ overflow: 'auto', maxHeight: 360, padding: '0 12px 12px' }}>
        {loading && <div style={emptyStyle}>Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div style={emptyStyle}>
            {assets.length === 0
              ? 'No assets yet. Drag images onto the canvas to upload.'
              : 'No matching assets.'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {filtered.map((asset: AssetFile) => (
            <div key={asset.key} style={assetCardStyle}>
              <div
                onClick={() => handleInsert(asset)}
                style={{
                  width: '100%',
                  height: 80,
                  backgroundImage: `url(${asset.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 4,
                  cursor: 'pointer',
                  backgroundColor: '#f5f5f5',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {asset.filename}
                </span>
                <button
                  onClick={() => handleDelete(asset.key)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12, padding: '0 2px' }}
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: 9, color: '#aaa' }}>
                {(asset.size / 1024).toFixed(0)}KB
              </div>
            </div>
          ))}
        </div>
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

const searchStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 6,
  outline: 'none',
}

const emptyStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#999',
  textAlign: 'center',
  padding: '24px 0',
}

const assetCardStyle: React.CSSProperties = {
  padding: 6,
  borderRadius: 8,
  border: '1px solid #eee',
  background: '#fff',
}
