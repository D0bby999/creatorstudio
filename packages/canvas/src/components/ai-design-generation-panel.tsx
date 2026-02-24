/**
 * AI Design Generation panel — inline section in AI Tools panel
 * Template picker + prompt → generates editable tldraw shapes
 */

import { useState, useCallback } from 'react'
import type { Editor } from 'tldraw'
import { AiDesignTemplatePicker } from './ai-design-template-picker'
import { mapLayoutToShapes, clearAiGeneratedShapes } from '../lib/canvas-ai-design-mapper'
import {
  createDesignSession,
  updateDesignSession,
  resetDesignSession,
  canRefine,
  type DesignSession,
} from '../lib/canvas-ai-design-session'

interface AiDesignGenerationPanelProps {
  editor: Editor
  designGenEndpoint: string
  onClose: () => void
}

type UiState = 'input' | 'generating' | 'result' | 'refining' | 'error'

export function AiDesignGenerationPanel({
  editor,
  designGenEndpoint,
  onClose,
}: AiDesignGenerationPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [presetId, setPresetId] = useState<string | null>('social-post')
  const [uiState, setUiState] = useState<UiState>('input')
  const [error, setError] = useState('')
  const [session, setSession] = useState<DesignSession>(createDesignSession)
  const [refinementInput, setRefinementInput] = useState('')

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setUiState('generating')
    setError('')

    try {
      const res = await fetch(designGenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), presetId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setUiState('error')
        setError(data.error ?? 'Generation failed')
        return
      }

      mapLayoutToShapes(editor, data.layout, data.sessionId)
      setSession(updateDesignSession(session, data.sessionId, data.layout))
      setUiState('result')
    } catch (err: any) {
      setUiState('error')
      setError(err.message ?? 'Network error')
    }
  }, [prompt, presetId, editor, designGenEndpoint, session])

  const handleRefine = useCallback(async () => {
    if (!refinementInput.trim() || !session.sessionId || !session.currentLayout) return
    setUiState('generating')
    setError('')

    try {
      // Clear previous AI shapes before inserting new ones
      clearAiGeneratedShapes(editor, session.sessionId)

      const res = await fetch(designGenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: refinementInput.trim(),
          sessionId: session.sessionId,
          refinement: true,
          currentLayout: session.currentLayout,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setUiState('error')
        setError(data.error ?? 'Refinement failed')
        return
      }

      mapLayoutToShapes(editor, data.layout, data.sessionId)
      setSession(updateDesignSession(session, data.sessionId, data.layout))
      setRefinementInput('')
      setUiState('result')
    } catch (err: any) {
      setUiState('error')
      setError(err.message ?? 'Network error')
    }
  }, [refinementInput, session, editor, designGenEndpoint])

  const handleNewDesign = () => {
    setSession(resetDesignSession())
    setPrompt('')
    setRefinementInput('')
    setUiState('input')
  }

  const maxChars = 1000

  return (
    <div>
      <div style={sectionLabel}>Generate Design</div>

      {uiState === 'input' && (
        <>
          <AiDesignTemplatePicker selected={presetId} onSelect={setPresetId} />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
            placeholder="Describe your design (e.g., 'Minimalist promo for a coffee shop grand opening')"
            style={{ ...inputStyle, height: 60, resize: 'vertical', marginTop: 8 }}
          />
          <div style={{ fontSize: 10, color: '#999', marginBottom: 4, textAlign: 'right' }}>
            {prompt.length}/{maxChars}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            style={actionBtnStyle}
          >
            Generate Design
          </button>
        </>
      )}

      {uiState === 'generating' && (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#666' }}>Creating your design...</div>
        </div>
      )}

      {uiState === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 11, color: '#22c55e' }}>
            Design added to canvas! (Turn {session.turnCount} of 5)
          </div>
          {canRefine(session) && (
            <>
              <textarea
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value.slice(0, maxChars))}
                placeholder="Refine: 'Make the heading larger' or 'Change colors to blue'"
                style={{ ...inputStyle, height: 44, resize: 'vertical' }}
              />
              <button
                onClick={handleRefine}
                disabled={!refinementInput.trim()}
                style={{ ...actionBtnStyle, background: '#555' }}
              >
                Refine Design
              </button>
            </>
          )}
          <button onClick={handleNewDesign} style={{ ...actionBtnStyle, background: '#888' }}>
            New Design
          </button>
        </div>
      )}

      {uiState === 'error' && (
        <div>
          <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 6 }}>{error}</div>
          <button onClick={handleNewDesign} style={actionBtnStyle}>Try Again</button>
        </div>
      )}
    </div>
  )
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
