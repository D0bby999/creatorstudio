/**
 * Main brand kit management panel
 */
import { useState, useEffect } from 'react'
import type { Editor } from 'tldraw'
import type { BrandKitData } from '../lib/brand-kit/brand-kit-types'
import { applyBrandKit } from '../lib/brand-kit/brand-kit-applicator'
import { BrandKitColorManager } from './brand-kit-color-manager'
import { BrandKitFontManager } from './brand-kit-font-manager'

interface BrandKitPanelProps {
  editor: Editor
  onClose: () => void
  apiEndpoint?: string
}

type Tab = 'colors' | 'fonts'

export function BrandKitPanel({ editor, onClose, apiEndpoint = '/api/canvas/brand-kit' }: BrandKitPanelProps) {
  const [kits, setKits] = useState<BrandKitData[]>([])
  const [activeKitId, setActiveKitId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('colors')
  const [loading, setLoading] = useState(false)
  const [showNewKit, setShowNewKit] = useState(false)
  const [newKitName, setNewKitName] = useState('')

  const activeKit = kits.find(k => k.id === activeKitId)

  useEffect(() => {
    fetchKits()
  }, [])

  const fetchKits = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiEndpoint)
      if (res.ok) {
        const data = await res.json()
        setKits(data.kits || [])
        if (data.kits?.length > 0 && !activeKitId) {
          setActiveKitId(data.kits[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch brand kits:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKit = async () => {
    if (!newKitName.trim()) {
      alert('Please enter a kit name')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKitName.trim(),
          colors: [],
          fonts: [],
          logos: [],
        }),
      })
      if (res.ok) {
        await fetchKits()
        setNewKitName('')
        setShowNewKit(false)
      } else {
        alert('Failed to create kit')
      }
    } catch (err) {
      console.error('Failed to create kit:', err)
      alert('Failed to create kit')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveKit = async () => {
    if (!activeKit?.id) return
    setLoading(true)
    try {
      const res = await fetch(`${apiEndpoint}/${activeKit.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeKit.name, colors: activeKit.colors, fonts: activeKit.fonts, logos: activeKit.logos }),
      })
      alert(res.ok ? 'Kit saved successfully' : 'Failed to save kit')
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save kit')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKit = async () => {
    if (!activeKit?.id || !window.confirm(`Delete kit "${activeKit.name}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(`${apiEndpoint}/${activeKit.id}`, { method: 'DELETE' })
      if (res.ok) { await fetchKits(); setActiveKitId(null) } else alert('Failed to delete kit')
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete kit')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyKit = () => {
    if (!activeKit) return
    const count = applyBrandKit(editor, activeKit)
    alert(`Applied brand kit to ${count} shape${count !== 1 ? 's' : ''}`)
  }

  const updateActiveKit = (updates: Partial<BrandKitData>) => {
    if (!activeKit) return
    setKits(kits.map(k => k.id === activeKitId ? { ...k, ...updates } : k))
  }

  const panelStyle = { position: 'absolute' as const, top: 48, left: 8, width: 320, maxHeight: 'calc(100vh - 64px)', background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' as const, zIndex: 300, overflow: 'hidden' as const }
  const headerStyle = { padding: 12, borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' as const, alignItems: 'center' }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Brand Kit</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {showNewKit ? (
            <>
              <input type="text" value={newKitName} onChange={e => setNewKitName(e.target.value)} placeholder="Kit name" style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 3 }} />
              <button onClick={handleCreateKit} disabled={loading} style={{ padding: 6 }}>Create</button>
              <button onClick={() => setShowNewKit(false)} style={{ padding: 6 }}>Cancel</button>
            </>
          ) : (
            <>
              <select value={activeKitId || ''} onChange={e => setActiveKitId(e.target.value)} style={{ flex: 1, padding: 6, border: '1px solid #ccc', borderRadius: 3 }}>
                <option value="">Select kit</option>
                {kits.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              <button onClick={() => setShowNewKit(true)} style={{ padding: 6 }}>New</button>
            </>
          )}
        </div>
      </div>

      {activeKit && (
        <>
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
            {(['colors', 'fonts'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: 8, border: 'none', background: activeTab === tab ? '#f0f0f0' : 'transparent', cursor: 'pointer', fontWeight: activeTab === tab ? 600 : 400 }}>
                {tab === 'colors' ? 'Colors' : 'Fonts'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {activeTab === 'colors' ? <BrandKitColorManager colors={activeKit.colors} onChange={colors => updateActiveKit({ colors })} /> : <BrandKitFontManager fonts={activeKit.fonts} onChange={fonts => updateActiveKit({ fonts })} />}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid #ddd', display: 'flex', gap: 8 }}>
            <button onClick={handleApplyKit} style={{ flex: 1, padding: 8, fontWeight: 600 }}>Apply to Project</button>
            <button onClick={handleSaveKit} disabled={loading} style={{ padding: 8 }}>Save</button>
            <button onClick={handleDeleteKit} disabled={loading} style={{ padding: 8, color: '#d00' }}>Delete</button>
          </div>
        </>
      )}
    </div>
  )
}
