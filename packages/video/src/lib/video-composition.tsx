import { AbsoluteFill, Img, Sequence, interpolate, useCurrentFrame, OffthreadVideo, Audio } from 'remotion'
import type { VideoProject, Clip, AudioClipProps } from '../types/video-types'

interface VideoCompositionProps {
  project: VideoProject
}

interface ClipRendererProps {
  clip: Clip
}

const ClipRenderer = ({ clip }: ClipRendererProps) => {
  const frame = useCurrentFrame()

  // Apply transitions
  let opacity = 1
  let transform = ''
  let clipPath = ''

  if (clip.transition) {
    const transitionFrames = clip.transition.durationInFrames

    switch (clip.transition.type) {
      case 'fade': {
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
        break
      }
      case 'slide-left': {
        const translateX = interpolate(frame, [0, transitionFrames], [-100, 0], { extrapolateRight: 'clamp' })
        transform = `translateX(${translateX}%)`
        break
      }
      case 'slide-right': {
        const translateX = interpolate(frame, [0, transitionFrames], [100, 0], { extrapolateRight: 'clamp' })
        transform = `translateX(${translateX}%)`
        break
      }
      case 'slide-up': {
        const translateY = interpolate(frame, [0, transitionFrames], [100, 0], { extrapolateRight: 'clamp' })
        transform = `translateY(${translateY}%)`
        break
      }
      case 'slide-down': {
        const translateY = interpolate(frame, [0, transitionFrames], [-100, 0], { extrapolateRight: 'clamp' })
        transform = `translateY(${translateY}%)`
        break
      }
      case 'wipe': {
        const progress = interpolate(frame, [0, transitionFrames], [0, 100], { extrapolateRight: 'clamp' })
        clipPath = `inset(0 ${100 - progress}% 0 0)`
        break
      }
    }
  }

  // Render based on clip type
  if (clip.type === 'image') {
    return (
      <AbsoluteFill style={{ opacity, transform, clipPath }}>
        <Img src={clip.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    )
  }

  if (clip.type === 'video') {
    return (
      <AbsoluteFill style={{ opacity, transform, clipPath }}>
        <OffthreadVideo src={clip.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
    )
  }

  if (clip.type === 'audio') {
    const audioProps = clip.props as AudioClipProps | undefined
    const volume = audioProps?.volume ?? 1
    return <Audio src={clip.src} volume={volume} />
  }

  if (clip.type === 'text') {
    const textProps = clip.props as { text?: string; fontSize?: number; color?: string } | undefined
    return (
      <AbsoluteFill
        style={{
          opacity,
          transform,
          clipPath,
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
