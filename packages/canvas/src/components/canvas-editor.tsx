/// <reference path="../tldraw-custom-shapes.d.ts" />
import { useState, useCallback, useMemo, useEffect, lazy, Suspense } from 'react'
import { Tldraw, react, type Editor, type TLShapeId } from 'tldraw'
import 'tldraw/tldraw.css'
import { SocialCardShapeUtil } from '../shapes/social-card-shape'
import { QuoteCardShapeUtil } from '../shapes/quote-card-shape'
import { CarouselSlideShapeUtil } from '../shapes/carousel-slide-shape'
import { EnhancedTextShapeUtil } from '../shapes/enhanced-text-shape'
import { BrandKitShapeUtil } from '../shapes/brand-kit-shape'
import { ConnectorShapeUtil } from '../shapes/connector-shape'
import { EnhancedImageShapeUtil } from '../shapes/enhanced-image-shape'
import { registerConnectorBindingHandlers } from '../shapes/connector-binding'
import { ConnectorTool } from '../tools/connector-tool'
import { CropTool } from '../tools/crop-tool'
import { ExportPanel } from './export-panel'
import { TemplatePanel } from './template-panel'
import { ShapeInsertionToolbar } from './shape-insertion-toolbar'
import { AssetPanel } from './asset-panel'
import { PropertyInspectorPanel } from './property-inspector-panel'
import { ImageEditingPanel } from './image-editing-panel'
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
import { TextEffectsPanel } from './text-effects-panel'
import { StyleCopyPasteIndicator } from './style-copy-paste-indicator'
import { copyShapeStyle, pasteShapeStyle, getClipboardStyle } from '../lib/style-clipboard'
import { BrandKitPanel } from './brand-kit-panel'
import { TransformPanel } from './transform-panel'
import { CanvasRulers } from './canvas-rulers'
import { CanvasGuidesOverlay } from './canvas-guides-overlay'
import { PageStrip } from './page-strip'
import { CommentMarkersOverlay } from './comment-marker'
import { CommentThreadPanel } from './comment-thread-panel'
import { listComments, createComment, type Comment } from '../lib/comments/comment-client'

const LazyAiToolsPanel = lazy(() => import('./ai-tools-panel').then(m => ({ default: m.AiToolsPanel })))
const LazyElementLibrary = lazy(() => import('./element-library-panel').then(m => ({ default: m.ElementLibraryPanel })))
const LazyAnimationPanel = lazy(() => import('./animation-panel').then(m => ({ default: m.AnimationPanel })))

const customShapeUtils = [
  SocialCardShapeUtil, QuoteCardShapeUtil, CarouselSlideShapeUtil,
  EnhancedTextShapeUtil, BrandKitShapeUtil, ConnectorShapeUtil,
  EnhancedImageShapeUtil,
]
const customTools = [ConnectorTool, CropTool]

interface CanvasEditorProps {
  persistenceKey?: string
  uploadEndpoint?: string
  assetsEndpoint?: string
  aiGenerateEndpoint?: string
  aiFillEndpoint?: string
  unsplashEndpoint?: string
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
  uploadEndpoint, assetsEndpoint, aiGenerateEndpoint, aiFillEndpoint, unsplashEndpoint,
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
  const [showElements, setShowElements] = useState(false)
  const [showBrandKit, setShowBrandKit] = useState(false)
  const [showImageEdit, setShowImageEdit] = useState(false)
  const [editingImageId, setEditingImageId] = useState<TLShapeId | null>(null)
  const [showTextEffects, setShowTextEffects] = useState(false)
  const [editingTextId, setEditingTextId] = useState<TLShapeId | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [multiplayer, setMultiplayer] = useState(false)
  const [activeTool, setActiveTool] = useState('select')
  const [followingUser, setFollowingUser] = useState<{ name: string; color: string } | null>(null)
  const [styleToast, setStyleToast] = useState<string | null>(null)
  const [showTransform, setShowTransform] = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [showPageStrip, setShowPageStrip] = useState(true)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)

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
      onToggleRulers: () => setShowRulers((v: boolean) => !v),
      onToggleGuides: () => setShowGuides((v: boolean) => !v),
      onToolChange: setActiveTool,
      onStyleCopy: () => {
        const ids = editor.getSelectedShapeIds()
        if (ids.length > 0) {
          copyShapeStyle(editor, ids[0])
          setStyleToast('Style copied')
        }
      },
      onStylePaste: () => {
        const ids = editor.getSelectedShapeIds()
        const style = getClipboardStyle()
        if (ids.length > 0 && style) {
          const count = pasteShapeStyle(editor, ids, style)
          setStyleToast(`Style applied to ${count} shape${count !== 1 ? 's' : ''}`)
        }
      },
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

  // Listen for image editor open events from property inspector
  useEffect(() => {
    const handleOpenImageEditor = (e: Event) => {
      const customEvent = e as CustomEvent<{ shapeId: TLShapeId }>
      setEditingImageId(customEvent.detail.shapeId)
      setShowImageEdit(true)
    }
    window.addEventListener('open-image-editor', handleOpenImageEditor)
    return () => window.removeEventListener('open-image-editor', handleOpenImageEditor)
  }, [])

  // Listen for text effects open events from property inspector
  useEffect(() => {
    const handleOpenTextEffects = (e: Event) => {
      const customEvent = e as CustomEvent<{ shapeId: TLShapeId }>
      setEditingTextId(customEvent.detail.shapeId)
      setShowTextEffects(true)
    }
    window.addEventListener('open-text-effects', handleOpenTextEffects)
    return () => window.removeEventListener('open-text-effects', handleOpenTextEffects)
  }, [])

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
    setShowArtboard(false); setShowAiTools(false); setShowElements(false); setShowBrandKit(false); setShowImageEdit(false)
    setShowTextEffects(false); setShowAnimation(false)
  }

  // Load comments for room
  const loadComments = useCallback(async () => {
    if (!roomId || !editor) return
    try {
      const currentPageId = editor.getCurrentPageId()
      const fetchedComments = await listComments(roomId, currentPageId)
      setComments(fetchedComments)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }, [roomId, editor])

  useEffect(() => {
    if (showComments && roomId) {
      loadComments()
    }
  }, [showComments, roomId, loadComments])

  // Handle adding comment at click position
  useEffect(() => {
    if (!editor || !isAddingComment) return

    const handleClick = async (e: PointerEvent) => {
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
      const content = prompt('Enter comment:')

      if (content && content.trim() && roomId) {
        try {
          const currentPageId = editor.getCurrentPageId()
          await createComment({
            roomId,
            pageId: currentPageId,
            x: pagePoint.x,
            y: pagePoint.y,
            content: content.trim(),
          })
          loadComments()
        } catch (err) {
          console.error('Failed to create comment:', err)
        }
      }

      setIsAddingComment(false)
    }

    const container = editor.getContainer()
    container.addEventListener('pointerdown', handleClick)
    return () => container.removeEventListener('pointerdown', handleClick)
  }, [editor, isAddingComment, roomId, loadComments])

  const handleCommentClick = (comment: Comment) => {
    setSelectedComment(comment)
  }

  const handleCommentUpdate = () => {
    loadComments()
    setSelectedComment(null)
  }

  const panels = useMemo(() => [
    { key: 'templates', label: 'Templates', active: showTemplates, toggle: () => { closeDropdowns(); setShowTemplates(v => !v) } },
    { key: 'assets', label: 'Assets', active: showAssets, toggle: () => { closeDropdowns(); setShowAssets(v => !v) } },
    { key: 'elements', label: 'Elements', active: showElements, toggle: () => { closeDropdowns(); setShowElements(v => !v) } },
    { key: 'brand', label: 'Brand', active: showBrandKit, toggle: () => { closeDropdowns(); setShowBrandKit(v => !v) } },
    { key: 'artboard', label: 'Artboard', active: showArtboard, toggle: () => { closeDropdowns(); setShowArtboard(v => !v) } },
    { key: 'export', label: 'Export', active: showExport, toggle: () => { closeDropdowns(); setShowExport(v => !v) } },
    { key: 'ai', label: 'AI', active: showAiTools, toggle: () => { closeDropdowns(); setShowAiTools(v => !v) }, condition: !!aiGenerateEndpoint },
    { key: 'image-edit', label: 'Image Edit', active: showImageEdit, toggle: () => { closeDropdowns(); setShowImageEdit(v => !v) } },
    { key: 'animation', label: 'Animation', active: showAnimation, toggle: () => { closeDropdowns(); setShowAnimation(v => !v) } },
    { key: 'sep', label: '', active: false, toggle: () => {} },
    { key: 'transform', label: 'Transform', active: showTransform, toggle: () => setShowTransform(v => !v) },
    { key: 'layers', label: 'Layers', active: showLayers, toggle: () => setShowLayers(v => !v) },
    { key: 'history', label: 'History', active: showHistory, toggle: () => setShowHistory(v => !v) },
    { key: 'inspector', label: 'Inspector', active: showInspector, toggle: () => setShowInspector(v => !v) },
    { key: 'comments', label: 'Comments', active: showComments, toggle: () => setShowComments(v => !v), condition: !!roomId },
  ], [showTemplates, showAssets, showElements, showBrandKit, showArtboard, showExport, showAiTools, showImageEdit, showAnimation, showTransform, showLayers, showHistory, showInspector, showComments, aiGenerateEndpoint, roomId])

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
      {showElements && editor && (
        <ErrorBoundaryPanel panelName="Elements" onClose={() => setShowElements(false)}>
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>Loading...</div>}>
            <LazyElementLibrary editor={editor} onClose={() => setShowElements(false)} unsplashEndpoint={unsplashEndpoint} />
          </Suspense>
        </ErrorBoundaryPanel>
      )}
      {showBrandKit && editor && (
        <ErrorBoundaryPanel panelName="Brand Kit" onClose={() => setShowBrandKit(false)}>
          <BrandKitPanel editor={editor} onClose={() => setShowBrandKit(false)} />
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
      {showImageEdit && editor && editingImageId && (
        <ErrorBoundaryPanel panelName="Image Editor" onClose={() => { setShowImageEdit(false); setEditingImageId(null) }}>
          <ImageEditingPanel editor={editor} shapeId={editingImageId} onClose={() => { setShowImageEdit(false); setEditingImageId(null) }} />
        </ErrorBoundaryPanel>
      )}
      {showTextEffects && editor && editingTextId && (
        <ErrorBoundaryPanel panelName="Text Effects" onClose={() => { setShowTextEffects(false); setEditingTextId(null) }}>
          <TextEffectsPanel editor={editor} shapeId={editingTextId} onClose={() => { setShowTextEffects(false); setEditingTextId(null) }} />
        </ErrorBoundaryPanel>
      )}
      {showTransform && editor && (
        <ErrorBoundaryPanel panelName="Transform" onClose={() => setShowTransform(false)}>
          <TransformPanel editor={editor} onClose={() => setShowTransform(false)} />
        </ErrorBoundaryPanel>
      )}
      {showAnimation && editor && (
        <ErrorBoundaryPanel panelName="Animation" onClose={() => setShowAnimation(false)}>
          <Suspense fallback={<div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>Loading...</div>}>
            <LazyAnimationPanel editor={editor} onClose={() => setShowAnimation(false)} />
          </Suspense>
        </ErrorBoundaryPanel>
      )}

      {showRulers && editor && <CanvasRulers editor={editor} />}
      {showGuides && editor && <CanvasGuidesOverlay editor={editor} />}

      {showPageStrip && editor && <PageStrip editor={editor} />}

      {showComments && editor && (
        <CommentMarkersOverlay
          editor={editor}
          comments={comments}
          selectedCommentId={selectedComment?.id || null}
          onCommentClick={handleCommentClick}
        />
      )}

      {selectedComment && (
        <CommentThreadPanel
          comment={selectedComment}
          currentUserId={userId}
          onClose={() => setSelectedComment(null)}
          onUpdate={handleCommentUpdate}
        />
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

      <StyleCopyPasteIndicator message={styleToast} />

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
