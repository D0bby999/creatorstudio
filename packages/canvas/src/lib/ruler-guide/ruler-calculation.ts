export interface Tick {
  position: number
  label: string
  isMajor: boolean
}

/**
 * Calculate ruler tick marks based on viewport range and zoom level.
 * Adaptive spacing: smaller intervals at higher zoom, larger at lower zoom.
 */
export function calculateTicks(
  viewportStart: number,
  viewportEnd: number,
  zoom: number,
): Tick[] {
  // Determine tick spacing based on zoom level
  let spacing: number
  let minorDivisions: number

  if (zoom > 5) {
    spacing = 10
    minorDivisions = 2 // 5px minor ticks
  } else if (zoom > 2) {
    spacing = 50
    minorDivisions = 5 // 10px minor ticks
  } else if (zoom > 0.5) {
    spacing = 100
    minorDivisions = 4 // 25px minor ticks
  } else {
    spacing = 200
    minorDivisions = 4 // 50px minor ticks
  }

  const ticks: Tick[] = []
  const minorSpacing = spacing / minorDivisions

  // Calculate start position (align to spacing grid)
  const start = Math.floor(viewportStart / minorSpacing) * minorSpacing
  const end = Math.ceil(viewportEnd / minorSpacing) * minorSpacing

  for (let pos = start; pos <= end; pos += minorSpacing) {
    const isMajor = pos % spacing === 0
    ticks.push({
      position: pos,
      label: isMajor ? String(Math.round(pos)) : '',
      isMajor,
    })
  }

  return ticks
}
