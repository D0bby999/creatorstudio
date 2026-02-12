export interface VideoProject {
  id: string
  name: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  tracks: Track[]
}

export interface Track {
  id: string
  type: 'video' | 'image' | 'text' | 'audio'
  clips: Clip[]
}

export interface Clip {
  id: string
  type: 'image' | 'video' | 'text'
  src: string
  from: number // start frame
  durationInFrames: number
  props?: Record<string, unknown>
  transition?: Transition
}

export interface Transition {
  type: 'fade' | 'slide-left' | 'slide-right' | 'wipe'
  durationInFrames: number
}

export type ExportFormat = 'mp4' | 'webm' | 'gif'

export interface ExportOptions {
  format: ExportFormat
  quality: 'low' | 'medium' | 'high'
}
