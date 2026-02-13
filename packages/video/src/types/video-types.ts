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
  type: 'image' | 'video' | 'text' | 'audio'
  src: string
  from: number // start frame
  durationInFrames: number
  props?: Record<string, unknown>
  transition?: Transition
}

export interface Transition {
  type: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'wipe'
  durationInFrames: number
}

export interface AudioClipProps {
  volume?: number
  startFrom?: number
}

export interface VideoClipProps {
  loop?: boolean
  muted?: boolean
}

export type ExportFormat = 'mp4' | 'webm' | 'gif'

export interface ExportOptions {
  format: ExportFormat
  quality: 'low' | 'medium' | 'high'
}
