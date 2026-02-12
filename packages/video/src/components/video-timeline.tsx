import type { CSSProperties } from 'react'
import type { VideoProject } from '../types/video-types'

interface VideoTimelineProps {
  project: VideoProject
  currentFrame: number
  onSeek: (frame: number) => void
}

const styles = {
  container: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    padding: '16px',
    borderRadius: '8px',
    color: '#ffffff',
  } as CSSProperties,
  tracksContainer: {
    position: 'relative',
    minHeight: '120px',
    marginTop: '8px',
  } as CSSProperties,
  track: {
    marginBottom: '12px',
    position: 'relative',
    height: '60px',
    backgroundColor: '#2a2a2a',
    borderRadius: '4px',
    overflow: 'hidden',
  } as CSSProperties,
  trackLabel: {
    fontSize: '12px',
    marginBottom: '4px',
    fontWeight: 600,
    color: '#aaaaaa',
  } as CSSProperties,
  clip: {
    position: 'absolute',
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 8px',
  } as CSSProperties,
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#ff0000',
    zIndex: 10,
    pointerEvents: 'none',
  } as CSSProperties,
  timeAxis: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#888888',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #333333',
  } as CSSProperties,
}

export const VideoTimeline = ({ project, currentFrame, onSeek }: VideoTimelineProps) => {
  const pixelsPerFrame = 800 / project.durationInFrames // Fixed width for timeline

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const frame = Math.floor((x / rect.width) * project.durationInFrames)
    onSeek(Math.max(0, Math.min(frame, project.durationInFrames - 1)))
  }

  const getClipColor = (type: string) => {
    switch (type) {
      case 'image':
        return '#4a9eff'
      case 'text':
        return '#ff9f4a'
      case 'video':
        return '#9f4aff'
      default:
        return '#666666'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.timeAxis}>
        <span>0:00</span>
        <span>
          {Math.floor(project.durationInFrames / project.fps)}s
        </span>
      </div>
      <div style={styles.tracksContainer} onClick={handleTimelineClick}>
        <div style={{ ...styles.playhead, left: `${(currentFrame / project.durationInFrames) * 100}%` }} />
        {project.tracks.map((track, trackIndex) => (
          <div key={track.id}>
            <div style={styles.trackLabel}>Track {trackIndex + 1} ({track.type})</div>
            <div style={styles.track}>
              {track.clips.map((clip) => {
                const left = (clip.from / project.durationInFrames) * 100
                const width = (clip.durationInFrames / project.durationInFrames) * 100
                const clipName = clip.type === 'text'
                  ? (clip.props?.text as string ?? clip.src)
                  : clip.type

                return (
                  <div
                    key={clip.id}
                    style={{
                      ...styles.clip,
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: getClipColor(clip.type),
                    }}
                    title={`${clipName} (${clip.from}-${clip.from + clip.durationInFrames})`}
                  >
                    {clipName}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
