export interface GradientStop {
  color: string
  position: number // 0-100
}

export interface GradientDef {
  type: 'linear' | 'radial'
  angle: number // degrees
  stops: GradientStop[]
}

export function createDefaultGradient(): GradientDef {
  return {
    type: 'linear',
    angle: 0,
    stops: [
      { color: '#000000', position: 0 },
      { color: '#ffffff', position: 100 },
    ],
  }
}
