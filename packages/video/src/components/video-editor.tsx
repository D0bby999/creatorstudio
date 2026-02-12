import { useState, useRef, type CSSProperties } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { VideoComposition } from '../lib/video-composition'
import { VideoTimeline } from './video-timeline'
import { ClipPanel } from './clip-panel'
import { VideoExportPanel } from './video-export-panel'
import type { VideoProject, Clip, ExportOptions } from '../types/video-types'

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#121212',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    gap: '16px',
    padding: '16px',
    overflow: 'hidden',
  } as CSSProperties,
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflow: 'auto',
  } as CSSProperties,
  playerContainer: {
    backgroundColor: '#1e1e1e',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as CSSProperties,
  rightPanel: {
    width: '280px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties,
  controls: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    justifyContent: 'center',
  } as CSSProperties,
  button: {
    padding: '8px 16px',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  } as CSSProperties,
}

// Default project with sample clips
const createDefaultProject = (): VideoProject => ({
  id: 'default',
  name: 'New Video Project',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300, // 10 seconds at 30fps
  tracks: [
    {
      id: 'track-1',
      type: 'image',
      clips: [
        {
          id: 'clip-1',
          type: 'image',
          src: 'https://picsum.photos/seed/sample1/1920/1080',
          from: 0,
          durationInFrames: 90,
          transition: { type: 'fade', durationInFrames: 15 },
        },
        {
          id: 'clip-2',
          type: 'text',
          src: 'Hello Creator Studio!',
          from: 90,
          durationInFrames: 90,
          props: {
            text: 'Hello Creator Studio!',
            fontSize: 72,
            color: '#ffffff',
          },
          transition: { type: 'fade', durationInFrames: 15 },
        },
      ],
    },
  ],
})

export const VideoEditor = () => {
  const [project, setProject] = useState<VideoProject>(createDefaultProject())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const playerRef = useRef<PlayerRef>(null)

  const handleAddClip = (newClip: Omit<Clip, 'id'>) => {
    const lastClip = project.tracks[0].clips[project.tracks[0].clips.length - 1]
    const startFrame = lastClip ? lastClip.from + lastClip.durationInFrames : 0
    const newDuration = startFrame + newClip.durationInFrames

    const clipWithId: Clip = {
      ...newClip,
      id: `clip-${Date.now()}`,
      from: startFrame,
    }

    setProject((prev) => ({
      ...prev,
      durationInFrames: Math.max(prev.durationInFrames, newDuration),
      tracks: [
        {
          ...prev.tracks[0],
          clips: [...prev.tracks[0].clips, clipWithId],
        },
      ],
    }))
  }

  const handleExport = (options: ExportOptions) => {
    alert(`Export coming soon!\nFormat: ${options.format}\nQuality: ${options.quality}\n\nFFmpeg.wasm integration is planned for future releases.`)
  }

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (frame: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(frame)
      setCurrentFrame(frame)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <div style={styles.leftPanel}>
          <div style={styles.playerContainer}>
            <Player
              ref={playerRef}
              component={VideoComposition}
              inputProps={{ project }}
              durationInFrames={project.durationInFrames}
              compositionWidth={project.width}
              compositionHeight={project.height}
              fps={project.fps}
              style={{
                width: '100%',
                maxWidth: '960px',
                aspectRatio: '16/9',
              }}
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onFrameUpdate={(f) => setCurrentFrame(f)}
            />
            <div style={styles.controls}>
              <button style={styles.button} onClick={handlePlayPause}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button style={styles.button} onClick={() => handleSeek(0)}>
                Reset
              </button>
            </div>
          </div>
          <VideoTimeline
            project={project}
            currentFrame={currentFrame}
            onSeek={handleSeek}
          />
        </div>
        <div style={styles.rightPanel}>
          <ClipPanel onAddClip={handleAddClip} fps={project.fps} />
          <VideoExportPanel onExport={handleExport} />
        </div>
      </div>
    </div>
  )
}
