/**
 * Page Transition Types
 * Type definitions for page transitions
 */

export type TransitionEffect =
  | 'slide-left'
  | 'slide-right'
  | 'fade'
  | 'dissolve'
  | 'push-left'
  | 'push-right'
  | 'push-up'
  | 'push-down'

export interface PageTransition {
  effect: TransitionEffect
  duration: number // seconds
}

export const DEFAULT_TRANSITION: PageTransition = {
  effect: 'fade',
  duration: 0.5,
}

export const TRANSITION_EFFECTS: { value: TransitionEffect; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'push-left', label: 'Push Left' },
  { value: 'push-right', label: 'Push Right' },
  { value: 'push-up', label: 'Push Up' },
  { value: 'push-down', label: 'Push Down' },
]
