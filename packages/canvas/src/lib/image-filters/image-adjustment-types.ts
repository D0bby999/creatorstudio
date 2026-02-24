/**
 * Image Filters and Adjustment Types
 * Core types for image editing functionality
 */

export interface ImageFilters {
  brightness: number // 0-2, default 1
  contrast: number // 0-3, default 1
  saturation: number // 0-3, default 1
  hueRotate: number // 0-360, default 0
  temperature: number // -100 to 100, default 0
  blur: number // 0-20, default 0
  fade: number // 0-1, default 0
}

export interface FilterPreset {
  name: string
  label: string
  filters: Partial<ImageFilters>
}

export interface ShadowEffect {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
}

export interface DuotoneEffect {
  darkColor: string
  lightColor: string
}

export interface PixelateEffect {
  blockSize: number
}

export interface ImageEffects {
  shadow?: ShadowEffect
  duotone?: DuotoneEffect
  pixelate?: PixelateEffect
}

export interface ImageMeta {
  imageFilters?: Partial<ImageFilters>
  imageEffects?: Partial<ImageEffects>
  presetName?: string
}

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  hueRotate: 0,
  temperature: 0,
  blur: 0,
  fade: 0,
}
