import type { Clip } from '../types/video-types'

export function reorderClips(clips: Clip[], fromIndex: number, toIndex: number): Clip[] {
  const result = [...clips]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)

  // Recalculate `from` positions sequentially
  let currentFrame = 0
  return result.map(clip => {
    const updated = { ...clip, from: currentFrame }
    currentFrame += clip.durationInFrames
    return updated
  })
}

export function resizeClip(clips: Clip[], clipId: string, newDuration: number): Clip[] {
  const updated = clips.map(clip =>
    clip.id === clipId ? { ...clip, durationInFrames: Math.max(1, newDuration) } : clip
  )

  let currentFrame = 0
  return updated.map(clip => {
    const result = { ...clip, from: currentFrame }
    currentFrame += clip.durationInFrames
    return result
  })
}

export function calculateTotalDuration(clips: Clip[]): number {
  return clips.reduce((total, clip) => total + clip.durationInFrames, 0)
}
