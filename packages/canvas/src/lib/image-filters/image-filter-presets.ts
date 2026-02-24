/**
 * Image Filter Presets
 * Collection of pre-defined filter combinations
 */

import type { FilterPreset } from './image-adjustment-types'

export const FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'grayscale',
    label: 'Grayscale',
    filters: { saturation: 0 },
  },
  {
    name: 'sepia',
    label: 'Sepia',
    filters: { saturation: 0.6, hueRotate: 20, temperature: 30 },
  },
  {
    name: 'vintage',
    label: 'Vintage',
    filters: { contrast: 0.85, saturation: 0.7, temperature: 15, fade: 0.15 },
  },
  {
    name: 'neon',
    label: 'Neon',
    filters: { brightness: 1.3, contrast: 1.5, saturation: 2, hueRotate: 280 },
  },
  {
    name: 'warm',
    label: 'Warm',
    filters: { temperature: 40, brightness: 1.05, saturation: 1.1 },
  },
  {
    name: 'cool',
    label: 'Cool',
    filters: { temperature: -40, brightness: 1.05, saturation: 1.1 },
  },
  {
    name: 'dramatic',
    label: 'Dramatic',
    filters: { contrast: 1.8, saturation: 1.3, brightness: 0.9 },
  },
  {
    name: 'faded',
    label: 'Faded',
    filters: { contrast: 0.7, saturation: 0.8, fade: 0.25, brightness: 1.1 },
  },
  {
    name: 'saturated',
    label: 'Saturated',
    filters: { saturation: 2, contrast: 1.2 },
  },
  {
    name: 'noir',
    label: 'Noir',
    filters: { saturation: 0, contrast: 1.6, brightness: 0.9 },
  },
  {
    name: 'retro',
    label: 'Retro',
    filters: { saturation: 1.3, hueRotate: 15, contrast: 1.1, fade: 0.1 },
  },
  {
    name: 'vivid',
    label: 'Vivid',
    filters: { saturation: 1.8, contrast: 1.3, brightness: 1.1 },
  },
  {
    name: 'muted',
    label: 'Muted',
    filters: { saturation: 0.5, contrast: 0.8, brightness: 1.05 },
  },
  {
    name: 'bold',
    label: 'Bold',
    filters: { contrast: 2, saturation: 1.5, brightness: 1.05 },
  },
  {
    name: 'cinematic',
    label: 'Cinematic',
    filters: { contrast: 1.4, saturation: 0.9, fade: 0.1, temperature: -10 },
  },
  {
    name: 'sunrise',
    label: 'Sunrise',
    filters: { temperature: 50, brightness: 1.15, saturation: 1.2, fade: 0.05 },
  },
  {
    name: 'moonlight',
    label: 'Moonlight',
    filters: { temperature: -50, brightness: 0.85, saturation: 0.7, contrast: 1.1 },
  },
]
