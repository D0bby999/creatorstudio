import { useState, type CSSProperties } from 'react'
import type { Clip } from '../types/video-types'

interface ClipPanelProps {
  onAddClip: (clip: Omit<Clip, 'id'>) => void
  fps: number
}

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    padding: '16px',
    borderRadius: '8px',
    color: '#ffffff',
  } as CSSProperties,
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#ffffff',
  } as CSSProperties,
  section: {
    marginBottom: '20px',
  } as CSSProperties,
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#aaaaaa',
  } as CSSProperties,
  button: {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '8px',
  } as CSSProperties,
  buttonSecondary: {
    backgroundColor: '#ff9f4a',
  } as CSSProperties,
  input: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#2a2a2a',
    border: '1px solid #444444',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '13px',
    marginBottom: '8px',
    boxSizing: 'border-box',
  } as CSSProperties,
  label: {
    fontSize: '12px',
    color: '#aaaaaa',
    marginBottom: '4px',
    display: 'block',
  } as CSSProperties,
}

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/1/1920/1080',
  'https://picsum.photos/seed/2/1920/1080',
  'https://picsum.photos/seed/3/1920/1080',
]

export const ClipPanel = ({ onAddClip, fps }: ClipPanelProps) => {
  const [textInput, setTextInput] = useState('')
  const [textDuration, setTextDuration] = useState('3')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioDuration, setAudioDuration] = useState('5')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState('5')

  const handleAddImage = (imageUrl: string) => {
    onAddClip({
      type: 'image',
      src: imageUrl,
      from: 0, // Will be positioned by parent
      durationInFrames: fps * 3, // 3 seconds default
      transition: { type: 'fade', durationInFrames: fps * 0.5 },
    })
  }

  const handleAddText = () => {
    if (!textInput.trim()) return

    const durationSeconds = parseFloat(textDuration) || 3
    onAddClip({
      type: 'text',
      src: textInput,
      from: 0,
      durationInFrames: fps * durationSeconds,
      props: {
        text: textInput,
        fontSize: 72,
        color: '#ffffff',
      },
      transition: { type: 'fade', durationInFrames: fps * 0.5 },
    })
    setTextInput('')
  }

  const handleAddAudio = () => {
    if (!audioUrl.trim()) return

    const durationSeconds = parseFloat(audioDuration) || 5
    onAddClip({
      type: 'audio',
      src: audioUrl,
      from: 0,
      durationInFrames: fps * durationSeconds,
      props: {
        volume: 1,
      },
    })
    setAudioUrl('')
  }

  const handleAddVideo = () => {
    if (!videoUrl.trim()) return

    const durationSeconds = parseFloat(videoDuration) || 5
    onAddClip({
      type: 'video',
      src: videoUrl,
      from: 0,
      durationInFrames: fps * durationSeconds,
      transition: { type: 'fade', durationInFrames: fps * 0.5 },
    })
    setVideoUrl('')
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Add Clips</h3>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Sample Images</div>
        {SAMPLE_IMAGES.map((url, index) => (
          <button
            key={url}
            style={styles.button}
            onClick={() => handleAddImage(url)}
          >
            Add Image {index + 1}
          </button>
        ))}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Text Clip</div>
        <label style={styles.label}>Text Content</label>
        <input
          type="text"
          style={styles.input}
          placeholder="Enter text..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
        />
        <label style={styles.label}>Duration (seconds)</label>
        <input
          type="number"
          style={styles.input}
          min="1"
          max="10"
          step="0.5"
          value={textDuration}
          onChange={(e) => setTextDuration(e.target.value)}
        />
        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={handleAddText}
        >
          Add Text Clip
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Audio Clip</div>
        <label style={styles.label}>Audio URL</label>
        <input
          type="text"
          style={styles.input}
          placeholder="https://example.com/audio.mp3"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddAudio()}
        />
        <label style={styles.label}>Duration (seconds)</label>
        <input
          type="number"
          style={styles.input}
          min="1"
          max="60"
          step="1"
          value={audioDuration}
          onChange={(e) => setAudioDuration(e.target.value)}
        />
        <button
          style={styles.button}
          onClick={handleAddAudio}
        >
          Add Audio Clip
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Video Clip</div>
        <label style={styles.label}>Video URL</label>
        <input
          type="text"
          style={styles.input}
          placeholder="https://example.com/video.mp4"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
        />
        <label style={styles.label}>Duration (seconds)</label>
        <input
          type="number"
          style={styles.input}
          min="1"
          max="60"
          step="1"
          value={videoDuration}
          onChange={(e) => setVideoDuration(e.target.value)}
        />
        <button
          style={styles.button}
          onClick={handleAddVideo}
        >
          Add Video Clip
        </button>
      </div>
    </div>
  )
}
