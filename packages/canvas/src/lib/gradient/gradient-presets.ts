import type { GradientDef } from './gradient-types'

export const PRESET_GRADIENTS: GradientDef[] = [
  { type: 'linear', angle: 135, stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
  { type: 'linear', angle: 90, stops: [{ color: '#f093fb', position: 0 }, { color: '#f5576c', position: 100 }] },
  { type: 'linear', angle: 45, stops: [{ color: '#4facfe', position: 0 }, { color: '#00f2fe', position: 100 }] },
  { type: 'radial', angle: 0, stops: [{ color: '#fa709a', position: 0 }, { color: '#fee140', position: 100 }] },
  { type: 'linear', angle: 0, stops: [{ color: '#30cfd0', position: 0 }, { color: '#330867', position: 100 }] },
  { type: 'linear', angle: 180, stops: [{ color: '#a8edea', position: 0 }, { color: '#fed6e3', position: 100 }] },
]
