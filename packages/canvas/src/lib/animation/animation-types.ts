/**
 * Animation Types
 * Type definitions for shape animations
 */

export type AnimationEffect =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'bounce'
  | 'zoom'
  | 'spin'
  | 'typewriter'

export type AnimationPhase = 'entrance' | 'exit'

export type EasingFunction = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'

export interface ShapeAnimation {
  effect: AnimationEffect
  phase: AnimationPhase
  delay: number // seconds
  duration: number // seconds
  easing: EasingFunction
}

export const DEFAULT_ANIMATION: ShapeAnimation = {
  effect: 'fade',
  phase: 'entrance',
  delay: 0,
  duration: 1,
  easing: 'ease',
}

export const ANIMATION_EFFECTS: { value: AnimationEffect; label: string; icon: string }[] = [
  { value: 'fade', label: 'Fade', icon: '○' },
  { value: 'slide-left', label: 'Slide Left', icon: '←' },
  { value: 'slide-right', label: 'Slide Right', icon: '→' },
  { value: 'slide-up', label: 'Slide Up', icon: '↑' },
  { value: 'slide-down', label: 'Slide Down', icon: '↓' },
  { value: 'bounce', label: 'Bounce', icon: '⇅' },
  { value: 'zoom', label: 'Zoom', icon: '⊕' },
  { value: 'spin', label: 'Spin', icon: '↻' },
  { value: 'typewriter', label: 'Typewriter', icon: '⌨' },
]

export const EASING_OPTIONS: { value: EasingFunction; label: string }[] = [
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'linear', label: 'Linear' },
]
