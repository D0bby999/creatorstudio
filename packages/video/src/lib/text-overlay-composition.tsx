import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'

interface TextOverlayProps {
  text: string
  fontSize?: number
  color?: string
  enterAnimation?: 'spring' | 'fade'
}

export const TextOverlayComposition = ({
  text,
  fontSize = 72,
  color = '#ffffff',
  enterAnimation = 'spring'
}: TextOverlayProps) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  let scale = 1
  let opacity = 1

  if (enterAnimation === 'spring') {
    scale = spring({ frame, fps, config: { damping: 12 } })
    opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' })
  } else {
    opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
  }

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          fontSize,
          color,
          fontWeight: 'bold',
          textAlign: 'center',
          transform: `scale(${scale})`,
          opacity,
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
