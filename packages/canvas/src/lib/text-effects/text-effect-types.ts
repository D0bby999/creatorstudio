export interface TextShadowEffect {
  offsetX: number
  offsetY: number
  blur: number
  color: string
}

export interface TextOutlineEffect {
  width: number
  color: string
}

export interface TextGlowEffect {
  color: string
  intensity: number
  spread: number
}

export interface TextCurveEffect {
  mode: 'arc' | 'wave' | 'circle'
  radius: number
}

export interface TextEffectsMeta {
  shadow?: TextShadowEffect
  outline?: TextOutlineEffect
  glow?: TextGlowEffect
  curve?: TextCurveEffect
}

export const DEFAULT_TEXT_SHADOW: TextShadowEffect = {
  offsetX: 2,
  offsetY: 2,
  blur: 4,
  color: '#000000',
}

export const DEFAULT_TEXT_OUTLINE: TextOutlineEffect = {
  width: 2,
  color: '#000000',
}

export const DEFAULT_TEXT_GLOW: TextGlowEffect = {
  color: '#ffffff',
  intensity: 5,
  spread: 3,
}

export const DEFAULT_TEXT_CURVE: TextCurveEffect = {
  mode: 'arc',
  radius: 200,
}
