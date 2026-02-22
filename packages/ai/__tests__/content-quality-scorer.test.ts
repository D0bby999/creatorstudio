import { describe, it, expect } from 'vitest'
import {
  scoreHook,
  scoreCta,
  scoreRange,
  scoreContent,
  type QualityPlatform,
} from '../src/lib/content-quality-scorer'

describe('content-quality-scorer', () => {
  describe('scoreHook', () => {
    it('should score question-based hooks highly', () => {
      expect(scoreHook('How do you stay productive?')).toBeGreaterThanOrEqual(40)
      expect(scoreHook('What makes great content?')).toBeGreaterThanOrEqual(40)
      expect(scoreHook('Why should you care about this?')).toBeGreaterThanOrEqual(40)
      expect(scoreHook('Did you know this secret tip?')).toBeGreaterThanOrEqual(40)
    })

    it('should score number-based hooks highly', () => {
      expect(scoreHook('5 ways to improve your content')).toBeGreaterThanOrEqual(30)
      expect(scoreHook('Top 10 tips for creators')).toBeGreaterThanOrEqual(30)
      expect(scoreHook('3 secrets to viral posts')).toBeGreaterThanOrEqual(30)
    })

    it('should score power words', () => {
      expect(scoreHook('The ultimate guide to success')).toBeGreaterThan(0)
      expect(scoreHook('Proven methods for growth')).toBeGreaterThan(0)
      expect(scoreHook('Secret tips revealed')).toBeGreaterThan(0)
    })

    it('should score plain statements lower', () => {
      const plainScore = scoreHook('This is a normal post about things')
      expect(plainScore).toBeLessThan(30)
    })

    it('should cap score at 100', () => {
      const superHook = 'How do you unlock the top 5 proven secrets revealed?'
      expect(scoreHook(superHook)).toBeLessThanOrEqual(100)
    })
  })

  describe('scoreCta', () => {
    it('should score strong CTAs at 100', () => {
      expect(scoreCta('Check the link in bio for more')).toBe(100)
      expect(scoreCta('Subscribe to my channel')).toBe(100)
      expect(scoreCta('DM me for details')).toBe(100)
      expect(scoreCta('Swipe up to learn more')).toBe(100)
    })

    it('should score moderate CTAs at 70', () => {
      expect(scoreCta('Share this with your friends')).toBe(70)
      expect(scoreCta('Comment below your thoughts')).toBe(70)
      expect(scoreCta('Save this for later')).toBe(70)
      expect(scoreCta('Tag a friend who needs this')).toBe(70)
    })

    it('should score weak CTAs at 40', () => {
      expect(scoreCta('What do you think about this?')).toBe(40)
      expect(scoreCta('Let me know your thoughts')).toBe(40)
      expect(scoreCta('Do you agree?')).toBe(40)
    })

    it('should score no CTA at 0', () => {
      expect(scoreCta('Just sharing my thoughts today')).toBe(0)
    })
  })

  describe('scoreRange', () => {
    it('should return 100 for value within optimal range', () => {
      expect(scoreRange(150, [100, 200])).toBe(100)
      expect(scoreRange(100, [100, 200])).toBe(100)
      expect(scoreRange(200, [100, 200])).toBe(100)
    })

    it('should degrade score below optimal range', () => {
      expect(scoreRange(50, [100, 200])).toBeLessThan(100)
      expect(scoreRange(50, [100, 200])).toBeGreaterThanOrEqual(0)
    })

    it('should degrade score above optimal range', () => {
      expect(scoreRange(220, [100, 200])).toBeLessThan(100)
      expect(scoreRange(220, [100, 200])).toBeGreaterThan(0)
    })

    it('should return 0 for values far below range', () => {
      expect(scoreRange(0, [100, 200])).toBe(0)
    })
  })

  describe('scoreContent', () => {
    it('should score short Instagram post with emojis and hashtags above 60', () => {
      const content = 'How do you capture the perfect sunset? 🌅✨ Share your tips below! #photography #nature #sunset #beautiful #instagood'
      const result = scoreContent(content, 'instagram')

      expect(result.overall).toBeGreaterThan(60)
      expect(result.engagement.hashtagCount).toBeGreaterThan(80)
      expect(result.engagement.emojiUsage).toBeGreaterThan(50)
    })

    it('should penalize long Twitter text for length', () => {
      const longTweet = 'This is a really long tweet that goes on and on and on and keeps going past the optimal length for Twitter which is around 140 characters so this should get penalized'
      const result = scoreContent(longTweet, 'twitter')

      expect(result.engagement.lengthScore).toBeLessThan(50)
    })

    it('should detect CTA presence', () => {
      const withCta = 'Check out my latest post! Link in bio for more details.'
      const withoutCta = 'Just a regular post here.'

      const resultWith = scoreContent(withCta, 'instagram')
      const resultWithout = scoreContent(withoutCta, 'instagram')

      expect(resultWith.engagement.ctaPresence).toBeGreaterThan(0)
      expect(resultWithout.engagement.ctaPresence).toBe(0)
    })

    it('should generate suggestions for missing CTA', () => {
      const content = 'Regular content without call to action'
      const result = scoreContent(content, 'instagram')

      const hasCtaSuggestion = result.suggestions.some(s => s.toLowerCase().includes('call-to-action'))
      expect(hasCtaSuggestion).toBe(true)
    })

    it('should generate suggestions for missing hashtags', () => {
      const content = 'Content without any hashtags at all'
      const result = scoreContent(content, 'instagram')

      const hasHashtagSuggestion = result.suggestions.some(s => s.toLowerCase().includes('hashtag'))
      expect(hasHashtagSuggestion).toBe(true)
    })

    it('should apply different platform weights', () => {
      const content = 'How to grow your audience? 🚀 #tips #growth #social'

      const igScore = scoreContent(content, 'instagram')
      const twitterScore = scoreContent(content, 'twitter')
      const linkedinScore = scoreContent(content, 'linkedin')

      // Different platforms should produce different overall scores due to different weights
      expect(igScore.overall).not.toBe(twitterScore.overall)
      expect(twitterScore.overall).not.toBe(linkedinScore.overall)
    })

    it('should score empty text low across all dimensions', () => {
      const result = scoreContent('', 'instagram')

      expect(result.engagement.hookStrength).toBeLessThan(20)
      expect(result.engagement.ctaPresence).toBe(0)
      expect(result.engagement.lengthScore).toBeLessThan(20)
      expect(result.overall).toBeLessThan(30)
    })

    it('should score TikTok with high emoji weight appropriately', () => {
      const withEmojis = 'Dance challenge! 💃🕺✨🎵🎶 #dance #tiktok #viral'
      const withoutEmojis = 'Dance challenge #dance #tiktok #viral'

      const resultWith = scoreContent(withEmojis, 'tiktok')
      const resultWithout = scoreContent(withoutEmojis, 'tiktok')

      // TikTok values emojis more, so the difference should be noticeable
      expect(resultWith.overall).toBeGreaterThan(resultWithout.overall)
    })

    it('should suggest length adjustment when too short', () => {
      const shortContent = 'Hi'
      const result = scoreContent(shortContent, 'linkedin')

      const hasLengthSuggestion = result.suggestions.some(s => s.toLowerCase().includes('too short'))
      expect(hasLengthSuggestion).toBe(true)
    })

    it('should suggest length adjustment when too long', () => {
      const longContent = 'A'.repeat(500)
      const result = scoreContent(longContent, 'twitter')

      const hasLengthSuggestion = result.suggestions.some(s => s.toLowerCase().includes('too long'))
      expect(hasLengthSuggestion).toBe(true)
    })

    it('should score question hook higher than plain text', () => {
      const withHook = 'Why is content quality important? Here are my thoughts...'
      const withoutHook = 'Content quality is important. Here are my thoughts...'

      const resultWith = scoreContent(withHook, 'instagram')
      const resultWithout = scoreContent(withoutHook, 'instagram')

      expect(resultWith.engagement.hookStrength).toBeGreaterThan(resultWithout.engagement.hookStrength)
    })

    it('should handle all platform types', () => {
      const platforms: QualityPlatform[] = ['instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'facebook', 'threads']
      const content = 'Test content for all platforms'

      platforms.forEach(platform => {
        const result = scoreContent(content, platform)
        expect(result.overall).toBeGreaterThanOrEqual(0)
        expect(result.overall).toBeLessThanOrEqual(100)
        expect(result.suggestions).toBeDefined()
      })
    })
  })
})
