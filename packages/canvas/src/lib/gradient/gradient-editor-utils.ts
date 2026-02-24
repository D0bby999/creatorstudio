import type { GradientDef, GradientStop } from './gradient-types'

export function addStop(
  def: GradientDef,
  color: string,
  position: number
): GradientDef {
  return {
    ...def,
    stops: [...def.stops, { color, position }].sort((a, b) => a.position - b.position),
  }
}

export function removeStop(def: GradientDef, index: number): GradientDef {
  if (def.stops.length <= 2) return def
  return {
    ...def,
    stops: def.stops.filter((_, i) => i !== index),
  }
}

export function updateStopColor(
  def: GradientDef,
  index: number,
  color: string
): GradientDef {
  return {
    ...def,
    stops: def.stops.map((s, i) => (i === index ? { ...s, color } : s)),
  }
}

export function updateStopPosition(
  def: GradientDef,
  index: number,
  position: number
): GradientDef {
  const clamped = Math.max(0, Math.min(100, position))
  return {
    ...def,
    stops: def.stops.map((s, i) => (i === index ? { ...s, position: clamped } : s)),
  }
}

export function reverseGradient(def: GradientDef): GradientDef {
  return {
    ...def,
    stops: def.stops.map((s) => ({ ...s, position: 100 - s.position })).reverse(),
  }
}
