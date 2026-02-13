import { describe, it, expect } from 'vitest'
import { reorderClips, resizeClip, calculateTotalDuration } from '../src/lib/timeline-clip-drag'
import type { Clip } from '../src/types/video-types'

describe('timeline-clip-drag', () => {
  const createMockClip = (id: string, from: number, duration: number): Clip => ({
    id,
    type: 'image',
    src: `https://example.com/${id}.jpg`,
    from,
    durationInFrames: duration,
  })

  describe('reorderClips', () => {
    it('should reorder clips and recalculate from positions', () => {
      const clips = [
        createMockClip('clip1', 0, 30),
        createMockClip('clip2', 30, 60),
        createMockClip('clip3', 90, 45),
      ]

      const result = reorderClips(clips, 0, 2)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('clip2')
      expect(result[0].from).toBe(0)
      expect(result[1].id).toBe('clip3')
      expect(result[1].from).toBe(60)
      expect(result[2].id).toBe('clip1')
      expect(result[2].from).toBe(105)
    })

    it('should handle same position as no-op', () => {
      const clips = [
        createMockClip('clip1', 0, 30),
        createMockClip('clip2', 30, 60),
      ]

      const result = reorderClips(clips, 1, 1)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('clip1')
      expect(result[1].id).toBe('clip2')
    })
  })

  describe('resizeClip', () => {
    it('should resize clip and shift subsequent clips', () => {
      const clips = [
        createMockClip('clip1', 0, 30),
        createMockClip('clip2', 30, 60),
        createMockClip('clip3', 90, 45),
      ]

      const result = resizeClip(clips, 'clip1', 60)

      expect(result[0].durationInFrames).toBe(60)
      expect(result[0].from).toBe(0)
      expect(result[1].from).toBe(60)
      expect(result[2].from).toBe(120)
    })

    it('should enforce minimum 1 frame duration', () => {
      const clips = [createMockClip('clip1', 0, 30)]

      const result = resizeClip(clips, 'clip1', -10)

      expect(result[0].durationInFrames).toBe(1)
    })
  })

  describe('calculateTotalDuration', () => {
    it('should sum all clip durations correctly', () => {
      const clips = [
        createMockClip('clip1', 0, 30),
        createMockClip('clip2', 30, 60),
        createMockClip('clip3', 90, 45),
      ]

      const total = calculateTotalDuration(clips)

      expect(total).toBe(135)
    })

    it('should return 0 for empty array', () => {
      const total = calculateTotalDuration([])

      expect(total).toBe(0)
    })
  })
})
