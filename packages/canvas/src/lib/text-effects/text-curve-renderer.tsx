import type { TextCurveEffect } from './text-effect-types'

export interface CurvedTextProps {
  text: string
  mode: TextCurveEffect['mode']
  radius: number
  fontSize: number
  fontFamily: string
  fontWeight: number
  fill: string
  letterSpacing: number
}

/**
 * Renders text along a curved path using SVG textPath
 * Supports arc, wave, and circle curve modes
 */
export function CurvedText({
  text,
  mode,
  radius,
  fontSize,
  fontFamily,
  fontWeight,
  fill,
  letterSpacing,
}: CurvedTextProps) {
  const pathId = `curve-path-${Math.random().toString(36).substr(2, 9)}`

  let pathD = ''
  let viewBoxWidth = 0
  let viewBoxHeight = 0

  if (mode === 'arc') {
    // Half-circle arc path
    const arcWidth = radius * 2
    viewBoxWidth = arcWidth
    viewBoxHeight = radius + fontSize
    pathD = `M 0,${radius} A ${radius},${radius} 0 0,1 ${arcWidth},${radius}`
  } else if (mode === 'wave') {
    // Sine wave approximation using cubic bezier curves
    const waveLength = radius * 2
    const amplitude = radius * 0.3
    viewBoxWidth = waveLength
    viewBoxHeight = amplitude * 2 + fontSize
    const cp1x = waveLength * 0.25
    const cp2x = waveLength * 0.75
    pathD = `M 0,${amplitude} Q ${cp1x},${amplitude * 2} ${waveLength / 2},${amplitude} T ${waveLength},${amplitude}`
  } else if (mode === 'circle') {
    // Full circle path
    const diameter = radius * 2
    viewBoxWidth = diameter
    viewBoxHeight = diameter
    pathD = `M ${radius},0 A ${radius},${radius} 0 1,1 ${radius},${diameter} A ${radius},${radius} 0 1,1 ${radius},0`
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <path id={pathId} d={pathD} fill="none" />
      </defs>
      <text
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fill={fill}
        letterSpacing={letterSpacing}
        textAnchor="middle"
      >
        <textPath href={`#${pathId}`} startOffset="50%">
          {text}
        </textPath>
      </text>
    </svg>
  )
}
