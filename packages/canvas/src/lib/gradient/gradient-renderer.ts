import type { GradientDef } from './gradient-types'

export function buildGradientCss(def: GradientDef): string {
  const stopsStr = def.stops
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')

  if (def.type === 'linear') {
    return `linear-gradient(${def.angle}deg, ${stopsStr})`
  } else {
    return `radial-gradient(circle, ${stopsStr})`
  }
}

export function buildGradientPreviewStyle(def: GradientDef): React.CSSProperties {
  return {
    background: buildGradientCss(def),
  }
}
