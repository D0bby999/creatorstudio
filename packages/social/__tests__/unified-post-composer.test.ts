import { describe, it, expect } from 'vitest'
import { composeForPlatform, composeForMultiplePlatforms } from '../src/lib/unified-post-composer'

describe('unified-post-composer', () => {
  describe('composeForPlatform', () => {
    it('truncates content >280 chars for Twitter with ellipsis', () => {
      const longContent = 'a'.repeat(300)
      const result = composeForPlatform(longContent, 'twitter')

      expect(result.content.length).toBe(280)
      expect(result.content.endsWith('...')).toBe(true)
      expect(result.truncated).toBe(true)
      expect(result.platform).toBe('twitter')
    })

    it('does not truncate content <=280 chars for Twitter', () => {
      const shortContent = 'This is a short tweet #test'
      const result = composeForPlatform(shortContent, 'twitter')

      expect(result.content).toBe(shortContent)
      expect(result.truncated).toBe(false)
      expect(result.characterCount).toBe(shortContent.length)
    })

    it('preserves content for Instagram (2200 limit)', () => {
      const content = 'a'.repeat(2000)
      const result = composeForPlatform(content, 'instagram')

      expect(result.content).toBe(content)
      expect(result.truncated).toBe(false)
      expect(result.platform).toBe('instagram')
    })

    it('truncates content >2200 chars for Instagram', () => {
      const longContent = 'a'.repeat(2500)
      const result = composeForPlatform(longContent, 'instagram')

      expect(result.content.length).toBe(2200)
      expect(result.content.endsWith('...')).toBe(true)
      expect(result.truncated).toBe(true)
    })

    it('extracts hashtags correctly', () => {
      const content = 'Testing #hashtag #test #social'
      const result = composeForPlatform(content, 'twitter')

      expect(result.hashtags).toEqual(['#hashtag', '#test', '#social'])
    })

    it('returns empty array when no hashtags', () => {
      const content = 'No hashtags here'
      const result = composeForPlatform(content, 'twitter')

      expect(result.hashtags).toEqual([])
    })

    it('handles empty content', () => {
      const result = composeForPlatform('', 'twitter')

      expect(result.content).toBe('')
      expect(result.truncated).toBe(false)
      expect(result.characterCount).toBe(0)
      expect(result.hashtags).toEqual([])
    })
  })

  describe('composeForMultiplePlatforms', () => {
    it('returns array with per-platform adaptations', () => {
      const content = 'a'.repeat(300) + ' #test'
      const platforms = ['twitter', 'instagram', 'linkedin'] as const
      const results = composeForMultiplePlatforms(content, platforms)

      expect(results).toHaveLength(3)

      const twitterPost = results.find(r => r.platform === 'twitter')
      expect(twitterPost?.truncated).toBe(true)
      expect(twitterPost?.content.length).toBe(280)

      const instagramPost = results.find(r => r.platform === 'instagram')
      expect(instagramPost?.truncated).toBe(false)

      const linkedinPost = results.find(r => r.platform === 'linkedin')
      expect(linkedinPost?.truncated).toBe(false)
    })

    it('preserves hashtags across all platforms', () => {
      const content = 'Test content #hashtag #social'
      const platforms = ['twitter', 'instagram'] as const
      const results = composeForMultiplePlatforms(content, platforms)

      results.forEach(result => {
        expect(result.hashtags).toEqual(['#hashtag', '#social'])
      })
    })

    it('handles empty platform array', () => {
      const content = 'Test content'
      const results = composeForMultiplePlatforms(content, [])

      expect(results).toEqual([])
    })

    it('handles single platform', () => {
      const content = 'Test content'
      const results = composeForMultiplePlatforms(content, ['twitter'])

      expect(results).toHaveLength(1)
      expect(results[0].platform).toBe('twitter')
    })
  })
})
