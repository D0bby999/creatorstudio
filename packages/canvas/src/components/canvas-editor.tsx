/// <reference path="../tldraw-custom-shapes.d.ts" />
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react'
import { Tldraw, react, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { SocialCardShapeUtil } from '../shapes/social-card-shape'
import { QuoteCardShapeUtil } from '../shapes/quote-card-shape'
import { CarouselSlideShapeUtil } from '../shapes/carousel-slide-shape'
import { TextOverlayShapeUtil } from '../shapes/text-overlay-shape'
import { BrandKitShapeUtil } from '../shapes/brand-kit-shape'
import { ConnectorShapeUtil } from '../shapes/connector-shape'
import { registerConnectorBindingHandlers } from '../shapes/connector-binding'
import { ConnectorTool } from '../tools/connector-tool'
import { CropTool } from '../tools/crop-tool'
import { ExportPanel } from './export-panel'
import { TemplatePanel } from './template-panel'
import { ShapeInsertionToolbar } from './shape-insertion-toolbar'
import { AssetPanel } from './asset-panel'
import { PropertyInspectorPanel } from './property-inspector-panel'
import { LayersPanel } from './layers-panel'
import { AlignmentToolbar } from './alignment-toolbar'
import { VersionHistoryPanel } from './version-history-panel'
import { ArtboardPresetsPanel } from './artboard-presets-panel'
import { ErrorBoundaryPanel } from './error-boundary-panel'
import { CanvasToolbar } from './canvas-toolbar'
import { ToolSelectionToolbar } from './tool-selection-toolbar'
import { createCanvasAssetStore, createFallbackAssetStore } from '../lib/canvas-asset-store'
import { registerCanvasShortcuts } from '../lib/canvas-keyboard-shortcuts'
import { createAutoSave, type SaveStatus } from '../lib/canvas-auto-save'
import { saveVersion } from '../lib/canvas-version-history'
import { cleanupFonts } from '../lib/canvas-font-loader'
import { useCanvasSync } from '../hooks/use-canvas-sync'
import { PresenceCursorsOverlay } from './presence-cursors-overlay'
import { UserListPanel } from './user-list-panel'
import { OfflineIndicator } from './offline-indicator'
import { FollowingIndicator } from './following-indicator'

const LazyAiToolsPanel = lazy(() => import('./ai-tools-panel').then(m => ({ default: m.AiToolsPanel })))

const customShapeUtils = [
  SocialCardShapeUtil, QuoteCardShapeUtil, CarouselSlideShapeUtil,
  TextOverlayShapeUtil, BrandKitShapeUtil, ConnectorShapeUtil,
]
const customTools = [ConnectorTool, CropTool]

interface CanvasEditorProps {
  persistenceKey?: string
  uploadEndpoint?: string
  assetsEndpoint?: string
  aiGenerateEndpoint?: string
  aiFillEndpoint?: string
  projectId?: string
  roomId?: string
  wsUrl?: string
  authToken?: string
  userId?: string
  userName?: string
  onSave?: (snapshot: any) => Promise<void>
  onExport?: () => void
}

export function CanvasEditor({
  persistenceKey = 'creator-studio-canvas',
  uploadEndpoint, assetsEndpoint, aiGenerateEndpoint, aiFillEndpoint,
  projectId, roomId, wsUrl, authToken,
  userId = 'anonymous', userName = 'Anonymous', onSave,
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
  const [multiplayer, setMultiplayer] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [followingUser, setFollowingUser] = useState<{ name: string; color: string } | null>(null)

  const collabEnabled = !!(roomId && wsUrl && authToken && multiplayer)
  const sync = useCanvasSync({
    roomId: roomId ?? '', token: authToken ?? '', wsUrl: wsUrl ?? '',
    userId, userName, enabled: collabEnabled,
  })

  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance)
    return registerConnectorBindingHandlers(editorInstance)
  }, [])

  const assetStore = useMemo(() => {
    if (uploadEndpoint) return createCanvasAssetStore(uploadEndpoint)
    return createFallbackAssetStore()
  }, [uploadEndpoint])

  useEffect(() => { return () => { cleanupFonts() } }, [])

  useEffect(() => {
    if (!editor || !onSave) return
    const pid = projectId ?? 'default'
    const { destroy } = createAutoSave(editor, {
      onSave, onStatusChange: setSaveStatus,
      onVersionMilestone: (snapshot) => { saveVersion(pid, snapshot).catch(() => {}) },
    })
    return destroy
  }, [editor, onSave, projectId])

  useEffect(() => {
    if (!editor) return
    return registerCanvasShortcuts(editor, {
      onSave: onSave ? () => { onSave(editor.store.getStoreSnapshot()) } : undefined,
      onExport: () => { closeDropdowns(); setShowExport((v: boolean) => !v) },
      onToggleLayers: () => setShowLayers((v: boolean) => !v),
      onToggleInspector: () => setShowInspector((v: boolean) => !v),
      onToolChange: setActiveTool,
    })
  }, [editor, onSave])

  // Reactive tool sync — fires only when getCurrentToolId() actually changes
  useEffect(() => {
    if (!editor) return
    return react('sync active tool', () => {
      const toolId = editor.getCurrentToolId()
      setActiveTool(toolId)
    })
  }, [editor])

  useEffect(() => {
    if (!editor || !collabEnabled) return
    let lastSendTime = 0
    const THROTTLE_MS = 50
    const onPointerMove = (e: PointerEvent) => {
      const now = Date.now()
      if (now - lastSendTime < THROTTLE_MS) return
      lastSendTime = now
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
      sync.sendPresence(pagePoint, editor.getSelectedShapeIds())
    }
    const el = editor.getContainer()
    el.addEventListener('pointermove', onPointerMove)
    return () => { el.removeEventListener('pointermove', onPointerMove) }
  }, [editor, collabEnabled, sync.sendPresence])

  const closeDropdowns = () => {
    setShowTemplates(false); setShowExport(false); setShowAssets(false)
    setShowArtboard(false); setShowAiTools(false)
  }

  const panels = useMemo(() => [
    { key: 'templates', label: 'Templates', active: showTemplates, toggle: () => { closeDropdowns(); setShowTemplates(v => !v) } },
    { key: 'assets', label: 'Assets', active: showAssets, toggle: () => { closeDropdowns(); setShowAssets(v => !v) } },
    { key: 'artboard', label: 'Artboard', active: showArtboard, toggle: () => { closeDropdowns(); setShowArtboard(v => !v) } },
    { key: 'export', label: 'Export', active: showExport, toggle: () => { closeDropdowns(); setShowExport(v => !v) } },
    { key: 'ai', label: 'AI', active: showAiTools, toggle: () => { closeDropdowns(); setShowAiTools(v => !v) }, condition: !!aiGenerateEndpoint },
    { key: 'sep', label: '', active: false, toggle: () => {} },
    { key: 'layers', label: 'Layers', active: showLayers, toggle: () => setShowLayers(v => !v) },
    { key: 'history', label: 'History', active: showHistory, toggle: () => setShowHistory(v => !v) },
    { key: 'inspector', label: 'Inspector', active: showInspector, toggle: () => setShowInspector(v => !v) },
  ], [showTemplates, showAssets, showArtboard, showExport, showAiTools, showLayers, showHistory, showInspector, aiGenerateEndpoint])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CanvasToolbar
        panels={panels} saveStatus={saveStatus}
        collabAvailable={!!(roomId && wsUrl)} collabEnabled={collabEnabled}
        collabStatus={sync.status} collabLatencyMs={sync.latencyMs}
        onMultiplayerChange={setMultiplayer}
      />

      {showTemplates && editor && (
        <ErrorBoundaryPanel panelName="Templates" onClose={() => setShowTemplates(false)}>
          <TemplatePanel editor={editor} onClose={() => setShowTemplates(false)} />
        </ErrorBoundaryPanel>
      )}
      {showAssets && editor && assetsEndpoint && (
        <ErrorBoundaryPanel panelName="Assets" onClose={() => setShowAssets(false)}>
          <AssetPanel editor={editor} onClose={() => setShowAssets(false)} assetsEndpoint={assetsEndpoint} />
        </ErrorBoundaryPanel>
      )}
      {showArtboard && editor && (
        <ErrorBoundaryPanel panelName="Artboard" onClose={() => setShowArtboard(false)}>
          <ArtboardPresetsPanel editor={editor} onClose={() => setShowArtboard(false)} />
        </ErrorBoundaryPanel>
      )}
      {showExport && editor && (
        <ErrorBoundaryPanel panelName="Export" onClose={() => setShowExport(false)}>
          <ExportPanel editor={editor} onClose={() => setShowExport(false)} />
        </ErrorBoundaryPanel>
      )}
      {showAiTools && editor && aiGenerateEndpoint && aiFillEndpoint && (
        <ErrorBoundaryPanel panelName="AI Tools" onClose={() => setShowAiTools(false)}>
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>Loading...</div>}>
            <LazyAiToolsPanel editor={editor} onClose={() => setShowAiTools(false)} aiGenerateEndpoint={aiGenerateEndpoint} aiFillEndpoint={aiFillEndpoint} />
          </Suspense>
        </ErrorBoundaryPanel>
      )}
      {showLayers && editor && (
        <ErrorBoundaryPanel panelName="Layers" onClose={() => setShowLayers(false)}>
          <LayersPanel editor={editor} onClose={() => setShowLayers(false)} />
        </ErrorBoundaryPanel>
      )}
      {showHistory && editor && (
        <ErrorBoundaryPanel panelName="History" onClose={() => setShowHistory(false)}>
          <VersionHistoryPanel editor={editor} projectId={projectId ?? 'default'} onClose={() => setShowHistory(false)} />
        </ErrorBoundaryPanel>
      )}
      {showInspector && editor && (
        <ErrorBoundaryPanel panelName="Inspector" onClose={() => setShowInspector(false)}>
          <PropertyInspectorPanel editor={editor} onClose={() => setShowInspector(false)} />
        </ErrorBoundaryPanel>
      )}

      {collabEnabled && <PresenceCursorsOverlay users={sync.users} />}
      {collabEnabled && <UserListPanel users={sync.users} currentUserId={userId} currentUserName={userName} />}
      {collabEnabled && <OfflineIndicator status={sync.status} queueSize={sync.queueSize} />}
      {collabEnabled && (
        <FollowingIndicator
          followingUserName={followingUser?.name ?? null}
          followingUserColor={followingUser?.color}
          onStopFollowing={() => setFollowingUser(null)}
        />
      )}

      {editor && <ToolSelectionToolbar editor={editor} activeTool={activeTool} onToolChange={setActiveTool} />}
      {editor && <ShapeInsertionToolbar editor={editor} />}
      {editor && <AlignmentToolbar editor={editor} />}

      <Tldraw
        persistenceKey={persistenceKey}
        shapeUtils={customShapeUtils}
        tools={customTools}
        onMount={handleMount}
        assets={assetStore}
      />
    </div>
  )
}
