import { useState, lazy, Suspense } from 'react'
import type { Editor } from 'tldraw'
import { generateAiImage, fillShapeContent, applyAutoLayout } from '../lib/canvas-ai-actions'

const LazyVideoSection = lazy(() =>
  import('./ai-tools-video-section').then(m => ({ default: m.AiToolsVideoSection }))
)
const LazyDesignGenPanel = lazy(() =>
  import('./ai-design-generation-panel').then(m => ({ default: m.AiDesignGenerationPanel }))
)

interface AiToolsPanelProps {
  editor: Editor
  onClose: () => void
  aiGenerateEndpoint: string
  aiFillEndpoint: string
  aiVideoGenEndpoint?: string
  aiVideoStatusEndpoint?: string
  aiDesignGenEndpoint?: string
}

export function AiToolsPanel({ editor, onClose, aiGenerateEndpoint, aiFillEndpoint, aiVideoGenEndpoint, aiVideoStatusEndpoint, aiDesignGenEndpoint }: AiToolsPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedShapes = editor.getSelectedShapes()
  const hasSelection = selectedShapes.length === 1
  const selectedType = hasSelection ? selectedShapes[0].type : null
  const canFill = selectedType && ['quote-card', 'carousel-slide', 'text-overlay', 'social-card'].includes(selectedType)

  const showStatus = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 3000)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading('generate')
    setError(null)
    const result = await generateAiImage(editor, aiGenerateEndpoint, prompt.trim())
    setLoading(null)
    if (result.success) { showStatus('Image generated!'); setPrompt('') }
    else showStatus(result.error ?? 'Failed', true)
  }

  const handleFill = async () => {
    if (!topic.trim() || !hasSelection) return
    setLoading('fill')
    setError(null)
    const result = await fillShapeContent(editor, aiFillEndpoint, selectedShapes[0].id as string, topic.trim())
    setLoading(null)
    if (result.success) { showStatus('Content filled!'); setTopic('') }
    else showStatus(result.error ?? 'Failed', true)
  }

  const handleAutoLayout = () => {
    const result = applyAutoLayout(editor)
    if (result.success) showStatus('Layout applied!')
    else showStatus(result.error ?? 'Failed', true)
  }

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>AI Tools</span>
        <button onClick={onClose} style={closeBtnStyle}>×</button>
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Generate Image */}
        <div>
          <div style={sectionLabel}>Generate Image</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want..."
            style={{ ...inputStyle, height: 60, resize: 'vertical' }}
          />
          <button
            onClick={handleGenerate}
            disabled={loading === 'generate' || !prompt.trim()}
            style={actionBtnStyle}
          >
            {loading === 'generate' ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {/* Fill Content */}
        <div>
          <div style={sectionLabel}>Fill Content</div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g., productivity tips)"
            style={inputStyle}
          />
          <button
            onClick={handleFill}
            disabled={loading === 'fill' || !topic.trim() || !canFill}
            style={actionBtnStyle}
          >
            {loading === 'fill' ? 'Filling...' : canFill ? 'Fill Selected Shape' : 'Select a content shape'}
          </button>
        </div>

        {/* Auto Layout */}
        <div>
          <div style={sectionLabel}>Auto Layout</div>
          <button onClick={handleAutoLayout} style={actionBtnStyle}>
            Organize Shapes
          </button>
        </div>

        {/* Generate Video */}
        {aiVideoGenEndpoint && aiVideoStatusEndpoint && (
          <Suspense fallback={null}>
            <LazyVideoSection
              editor={editor}
              videoGenEndpoint={aiVideoGenEndpoint}
              videoStatusEndpoint={aiVideoStatusEndpoint}
            />
          </Suspense>
        )}

        {/* AI Design Generation */}
        {aiDesignGenEndpoint && (
          <Suspense fallback={null}>
            <LazyDesignGenPanel
              editor={editor}
              designGenEndpoint={aiDesignGenEndpoint}
              onClose={onClose}
            />
          </Suspense>
        )}

        {/* Status messages */}
        {error && <div style={{ fontSize: 11, color: '#ef4444', padding: '4px 0' }}>{error}</div>}
        {success && <div style={{ fontSize: 11, color: '#22c55e', padding: '4px 0' }}>{success}</div>}
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
  width: 280,
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

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 5,
  outline: 'none',
  fontFamily: 'inherit',
  marginBottom: 6,
}

const actionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: 'none',
  background: '#333',
  color: '#fff',
  cursor: 'pointer',
}
