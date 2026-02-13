import { describe, it, expect } from 'vitest'
import type { Clip, Transition, AudioClipProps, VideoClipProps } from '../src/types/video-types'

describe('video-types', () => {
  describe('Clip type', () => {
    it('should include audio type', () => {
      const audioClip: Clip = {
        id: 'audio1',
        type: 'audio',
        src: 'https://example.com/audio.mp3',
        from: 0,
        durationInFrames: 150,
      }

      expect(audioClip.type).toBe('audio')
    })

    it('should include video type', () => {
      const videoClip: Clip = {
        id: 'video1',
        type: 'video',
        src: 'https://example.com/video.mp4',
        from: 0,
        durationInFrames: 300,
      }

      expect(videoClip.type).toBe('video')
    })

    it('should support image type', () => {
      const imageClip: Clip = {
        id: 'image1',
        type: 'image',
        src: 'https://example.com/image.jpg',
        from: 0,
        durationInFrames: 90,
      }

      expect(imageClip.type).toBe('image')
    })

    it('should support text type', () => {
      const textClip: Clip = {
        id: 'text1',
        type: 'text',
        src: 'Hello World',
        from: 0,
        durationInFrames: 90,
      }

      expect(textClip.type).toBe('text')
    })
  })

  describe('Transition type', () => {
    it('should include slide-up transition', () => {
      const transition: Transition = {
        type: 'slide-up',
        durationInFrames: 15,
      }

      expect(transition.type).toBe('slide-up')
    })

    it('should include slide-down transition', () => {
      const transition: Transition = {
        type: 'slide-down',
        durationInFrames: 15,
      }

      expect(transition.type).toBe('slide-down')
    })

    it('should include wipe transition', () => {
      const transition: Transition = {
        type: 'wipe',
        durationInFrames: 20,
      }

      expect(transition.type).toBe('wipe')
    })

    it('should include existing transition types', () => {
      const transitions: Transition[] = [
        { type: 'fade', durationInFrames: 10 },
        { type: 'slide-left', durationInFrames: 15 },
        { type: 'slide-right', durationInFrames: 15 },
      ]

      expect(transitions[0].type).toBe('fade')
      expect(transitions[1].type).toBe('slide-left')
      expect(transitions[2].type).toBe('slide-right')
    })
  })

  describe('Type guards', () => {
    it('should validate AudioClipProps', () => {
      const audioProps: AudioClipProps = {
        volume: 0.8,
        startFrom: 10,
      }

      expect(audioProps.volume).toBe(0.8)
      expect(audioProps.startFrom).toBe(10)
    })

    it('should allow optional AudioClipProps fields', () => {
      const audioProps: AudioClipProps = {}

      expect(audioProps.volume).toBeUndefined()
      expect(audioProps.startFrom).toBeUndefined()
    })

    it('should validate VideoClipProps', () => {
      const videoProps: VideoClipProps = {
        loop: true,
        muted: false,
      }

      expect(videoProps.loop).toBe(true)
      expect(videoProps.muted).toBe(false)
    })

    it('should allow optional VideoClipProps fields', () => {
      const videoProps: VideoClipProps = {}

      expect(videoProps.loop).toBeUndefined()
      expect(videoProps.muted).toBeUndefined()
    })
  })
})
