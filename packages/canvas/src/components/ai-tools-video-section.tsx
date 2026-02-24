/**
 * Video generation section for AI Tools panel
 * Prompt input + aspect ratio + progress states + quota display
 */

import { useState, useCallback } from 'react'
import type { Editor } from 'tldraw'
import {
  startVideoGeneration,
  pollVideoStatus,
  insertVideoOnCanvas,
  type VideoJobStatus,
  type VideoGenQuota,
} from '../lib/canvas-ai-video-actions'

interface AiToolsVideoSectionProps {
  editor: Editor
  videoGenEndpoint: string
  videoStatusEndpoint: string
}

type UiState = 'idle' | 'generating' | 'complete' | 'error'

export function AiToolsVideoSection({
  editor,
  videoGenEndpoint,
  videoStatusEndpoint,
}: AiToolsVideoSectionProps) {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [uiState, setUiState] = useState<UiState>('idle')
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const [quota, setQuota] = useState<VideoGenQuota | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setUiState('generating')
    setError('')
    setStatusText('Starting video generation...')

    const startResult = await startVideoGeneration(videoGenEndpoint, prompt.trim(), aspectRatio)
    if (!startResult.success) {
      setUiState('error')
      setError(startResult.error)
      return
    }

    setQuota(startResult.data.quota)
    setStatusText('Generating video (this may take 1-2 minutes)...')

    const statusResult = await pollVideoStatus(
      videoStatusEndpoint,
      startResult.data.jobId,
      (status: VideoJobStatus) => {
        if (status === 'processing') setStatusText('Video is rendering...')
      },
    )

    if (statusResult.status === 'completed' && statusResult.videoUrl) {
      insertVideoOnCanvas(editor, statusResult.videoUrl, { jobId: startResult.data.jobId })
      setUiState('complete')
      setStatusText('Video added to canvas!')
      setPrompt('')
      setTimeout(() => setUiState('idle'), 3000)
    } else {
      setUiState('error')
      setError(statusResult.error ?? 'Video generation failed')
    }
  }, [prompt, aspectRatio, editor, videoGenEndpoint, videoStatusEndpoint])

  const maxChars = 500

  return (
    <div>
      <div style={sectionLabel}>Generate Video</div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
        placeholder="Describe the video you want..."
        disabled={uiState === 'generating'}
        style={{ ...inputStyle, height: 56, resize: 'vertical' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as any)}
          disabled={uiState === 'generating'}
          style={{ ...inputStyle, width: '48%', marginBottom: 0 }}
        >
          <option value="16:9">16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
          <option value="1:1">1:1 Square</option>
        </select>
        <div style={{ fontSize: 10, color: '#999', alignSelf: 'center' }}>
          {prompt.length}/{maxChars}
        </div>
      </div>
      <button
        onClick={handleGenerate}
        disabled={uiState === 'generating' || !prompt.trim()}
        style={actionBtnStyle}
      >
        {uiState === 'generating' ? 'Generating...' : 'Generate Video'}
      </button>

      {uiState === 'generating' && (
        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{statusText}</div>
      )}
      {uiState === 'complete' && (
        <div style={{ fontSize: 10, color: '#22c55e', marginTop: 4 }}>{statusText}</div>
      )}
      {uiState === 'error' && (
        <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
      {quota && (
        <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
          {quota.limit - quota.used} of {quota.limit} generations remaining this month
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
