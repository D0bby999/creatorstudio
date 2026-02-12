import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame } from 'remotion'
import type { VideoProject, Clip } from '../types/video-types'

interface VideoCompositionProps {
  project: VideoProject
}

interface ClipRendererProps {
  clip: Clip
}

const ClipRenderer = ({ clip }: ClipRendererProps) => {
  const frame = useCurrentFrame()

  // Apply fade transition if present
  let opacity = 1
  if (clip.transition?.type === 'fade') {
    const transitionFrames = clip.transition.durationInFrames
    // Fade in at start
    if (frame < transitionFrames) {
      opacity = interpolate(frame, [0, transitionFrames], [0, 1], {
        extrapolateRight: 'clamp',
      })
    }
    // Fade out at end
    const fadeOutStart = clip.durationInFrames - transitionFrames
    if (frame >= fadeOutStart) {
      opacity = interpolate(
        frame,
        [fadeOutStart, clip.durationInFrames],
        [1, 0],
        { extrapolateRight: 'clamp' },
      )
    }
  }

  // Render based on clip type
  if (clip.type === 'image') {
    return (
      <AbsoluteFill style={{ opacity }}>
        <Img src={clip.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    )
  }

  if (clip.type === 'text') {
    const textProps = clip.props as { text?: string; fontSize?: number; color?: string } | undefined
    return (
      <AbsoluteFill
        style={{
          opacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <div
          style={{
            fontSize: textProps?.fontSize ?? 72,
            color: textProps?.color ?? '#ffffff',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          }}
        >
          {textProps?.text ?? clip.src}
        </div>
      </AbsoluteFill>
    )
  }

  return null
}

export const VideoComposition = ({ project }: VideoCompositionProps) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {project.tracks.map((track) =>
        track.clips.map((clip) => (
          <Sequence
            key={clip.id}
            from={clip.from}
            durationInFrames={clip.durationInFrames}
          >
            <ClipRenderer clip={clip} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  )
}
