/// <reference path="../tldraw-custom-shapes.d.ts" />
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { SocialCardShapeUtil } from '../shapes/social-card-shape'
import { QuoteCardShapeUtil } from '../shapes/quote-card-shape'
import { CarouselSlideShapeUtil } from '../shapes/carousel-slide-shape'
import { TextOverlayShapeUtil } from '../shapes/text-overlay-shape'
import { BrandKitShapeUtil } from '../shapes/brand-kit-shape'
import { ExportPanel } from './export-panel'
import { TemplatePanel } from './template-panel'
import { ShapeInsertionToolbar } from './shape-insertion-toolbar'
import { AssetPanel } from './asset-panel'
import { PropertyInspectorPanel } from './property-inspector-panel'
import { LayersPanel } from './layers-panel'
import { AlignmentToolbar } from './alignment-toolbar'
import { VersionHistoryPanel } from './version-history-panel'
import { ArtboardPresetsPanel } from './artboard-presets-panel'
import { AiToolsPanel } from './ai-tools-panel'
import { createCanvasAssetStore, createFallbackAssetStore } from '../lib/canvas-asset-store'
import { registerCanvasShortcuts } from '../lib/canvas-keyboard-shortcuts'
import { createAutoSave, type SaveStatus } from '../lib/canvas-auto-save'
import { saveVersion } from '../lib/canvas-version-history'

const customShapeUtils = [
  SocialCardShapeUtil,
  QuoteCardShapeUtil,
  CarouselSlideShapeUtil,
  TextOverlayShapeUtil,
  BrandKitShapeUtil,
]

interface CanvasEditorProps {
  persistenceKey?: string
  uploadEndpoint?: string
  assetsEndpoint?: string
  aiGenerateEndpoint?: string
  aiFillEndpoint?: string
  projectId?: string
  onSave?: (snapshot: any) => Promise<void>
  onExport?: () => void
}

export function CanvasEditor({
  persistenceKey = 'creator-studio-canvas',
  uploadEndpoint,
  assetsEndpoint,
  aiGenerateEndpoint,
  aiFillEndpoint,
  projectId,
  onSave,
}: CanvasEditorProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showAssets, setShowAssets] = useState(false)
  const [showInspector, setShowInspector] = useState(false)
  const [showLayers, setShowLayers] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showArtboard, setShowArtboard] = useState(false)
  const [showAiTools, setShowAiTools] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance)
  }, [])

  const assetStore = useMemo(() => {
    if (uploadEndpoint) return createCanvasAssetStore(uploadEndpoint)
    return createFallbackAssetStore()
  }, [uploadEndpoint])

  // Auto-save
  useEffect(() => {
    if (!editor || !onSave) return
    const pid = projectId ?? 'default'
    const { destroy } = createAutoSave(editor, {
      onSave,
      onStatusChange: setSaveStatus,
      onVersionMilestone: (snapshot) => {
        saveVersion(pid, snapshot).catch(() => {})
      },
    })
    return destroy
  }, [editor, onSave, projectId])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return
    return registerCanvasShortcuts(editor, {
      onSave: onSave ? () => {
        const snapshot = editor.store.getStoreSnapshot()
        onSave(snapshot)
      } : undefined,
      onExport: () => { closeDropdowns(); setShowExport((v: boolean) => !v) },
      onToggleLayers: () => setShowLayers((v: boolean) => !v),
      onToggleInspector: () => setShowInspector((v: boolean) => !v),
    })
  }, [editor, onSave])

  const closeDropdowns = () => {
    setShowTemplates(false)
    setShowExport(false)
    setShowAssets(false)
    setShowArtboard(false)
    setShowAiTools(false)
  }

  const statusColors: Record<SaveStatus, string> = {
    idle: '#ccc', unsaved: '#eab308', saving: '#3b82f6', saved: '#22c55e', error: '#ef4444',
  }
  const statusLabels: Record<SaveStatus, string> = {
    idle: '', unsaved: 'Unsaved', saving: 'Saving...', saved: 'Saved', error: 'Save failed',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Top toolbar */}
      <div style={toolbarContainerStyle}>
        <button onClick={() => { closeDropdowns(); setShowTemplates(!showTemplates) }} style={toolbarBtnStyle(showTemplates)}>
          Templates
        </button>
        <button onClick={() => { closeDropdowns(); setShowAssets(!showAssets) }} style={toolbarBtnStyle(showAssets)}>
          Assets
        </button>
        <button onClick={() => { closeDropdowns(); setShowArtboard(!showArtboard) }} style={toolbarBtnStyle(showArtboard)}>
          Artboard
        </button>
        <button onClick={() => { closeDropdowns(); setShowExport(!showExport) }} style={toolbarBtnStyle(showExport)}>
          Export
        </button>
        {aiGenerateEndpoint && (
          <button onClick={() => { closeDropdowns(); setShowAiTools(!showAiTools) }} style={toolbarBtnStyle(showAiTools)}>
            AI
          </button>
        )}
        <div style={toolbarSeparator} />
        <button onClick={() => setShowLayers(!showLayers)} style={toolbarBtnStyle(showLayers)}>
          Layers
        </button>
        <button onClick={() => setShowHistory(!showHistory)} style={toolbarBtnStyle(showHistory)}>
          History
        </button>
        <button onClick={() => setShowInspector(!showInspector)} style={toolbarBtnStyle(showInspector)}>
          Inspector
        </button>

        {saveStatus !== 'idle' && (
          <>
            <div style={toolbarSeparator} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 4px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColors[saveStatus] }} />
              <span style={{ fontSize: 11, color: '#888' }}>{statusLabels[saveStatus]}</span>
            </div>
          </>
        )}
      </div>

      {/* Dropdown panels */}
      {showTemplates && editor && <TemplatePanel editor={editor} onClose={() => setShowTemplates(false)} />}
      {showAssets && editor && assetsEndpoint && <AssetPanel editor={editor} onClose={() => setShowAssets(false)} assetsEndpoint={assetsEndpoint} />}
      {showArtboard && editor && <ArtboardPresetsPanel editor={editor} onClose={() => setShowArtboard(false)} />}
      {showExport && editor && <ExportPanel editor={editor} onClose={() => setShowExport(false)} />}
      {showAiTools && editor && aiGenerateEndpoint && aiFillEndpoint && (
        <AiToolsPanel editor={editor} onClose={() => setShowAiTools(false)} aiGenerateEndpoint={aiGenerateEndpoint} aiFillEndpoint={aiFillEndpoint} />
      )}

      {/* Side panels */}
      {showLayers && editor && <LayersPanel editor={editor} onClose={() => setShowLayers(false)} />}
      {showHistory && editor && <VersionHistoryPanel editor={editor} projectId={projectId ?? 'default'} onClose={() => setShowHistory(false)} />}
      {showInspector && editor && <PropertyInspectorPanel editor={editor} onClose={() => setShowInspector(false)} />}

      {/* Shape toolbar + alignment */}
      {editor && <ShapeInsertionToolbar editor={editor} />}
      {editor && <AlignmentToolbar editor={editor} />}

      <Tldraw
        persistenceKey={persistenceKey}
        shapeUtils={customShapeUtils}
        onMount={handleMount}
        assets={assetStore}
      />
    </div>
  )
}

const toolbarContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 300,
  display: 'flex',
  gap: 4,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: '4px 8px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  border: '1px solid var(--color-border, #e5e5e5)',
}

const toolbarSeparator: React.CSSProperties = {
  width: 1,
  background: '#e0e0e0',
  margin: '2px 4px',
}

function toolbarBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#e8e8e8' : 'transparent',
    color: '#333',
  }
}
