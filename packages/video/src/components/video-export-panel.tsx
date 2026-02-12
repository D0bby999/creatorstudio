import { useState, type CSSProperties } from 'react'
import type { ExportFormat, ExportOptions } from '../types/video-types'

interface VideoExportPanelProps {
  onExport: (options: ExportOptions) => void
}

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    padding: '16px',
    borderRadius: '8px',
    color: '#ffffff',
    marginTop: '16px',
  } as CSSProperties,
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#ffffff',
  } as CSSProperties,
  label: {
    fontSize: '12px',
    color: '#aaaaaa',
    marginBottom: '4px',
    display: 'block',
    marginTop: '12px',
  } as CSSProperties,
  select: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444444',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '13px',
    marginBottom: '8px',
    cursor: 'pointer',
  } as CSSProperties,
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#22c55e',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '16px',
  } as CSSProperties,
  buttonDisabled: {
    backgroundColor: '#666666',
    cursor: 'not-allowed',
  } as CSSProperties,
  note: {
    fontSize: '11px',
    color: '#888888',
    marginTop: '8px',
    fontStyle: 'italic',
  } as CSSProperties,
}

export const VideoExportPanel = ({ onExport }: VideoExportPanelProps) => {
  const [format, setFormat] = useState<ExportFormat>('mp4')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')

  const handleExport = () => {
    onExport({ format, quality })
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Export Video</h3>

      <label style={styles.label}>Format</label>
      <select
        style={styles.select}
        value={format}
        onChange={(e) => setFormat(e.target.value as ExportFormat)}
      >
        <option value="mp4">MP4 (Coming Soon)</option>
        <option value="webm">WebM (Coming Soon)</option>
        <option value="gif">GIF (Coming Soon)</option>
      </select>

      <label style={styles.label}>Quality</label>
      <select
        style={styles.select}
        value={quality}
        onChange={(e) => setQuality(e.target.value as 'low' | 'medium' | 'high')}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <button style={styles.button} onClick={handleExport}>
        Export Video
      </button>

      <p style={styles.note}>
        FFmpeg.wasm integration coming soon. Export functionality is currently disabled.
      </p>
    </div>
  )
}
