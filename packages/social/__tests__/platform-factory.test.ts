import { describe, it, expect } from 'vitest'
import { getPlatformClient, getPlatformConfig, PLATFORM_CONFIGS } from '../src/lib/platform-factory'
import { InstagramClient } from '../src/lib/instagram-client'
import { TwitterClient } from '../src/lib/twitter-client'
import { LinkedInClient } from '../src/lib/linkedin-client'

describe('platform-factory', () => {
  describe('getPlatformClient', () => {
    it('returns InstagramClient for instagram platform', () => {
      const client = getPlatformClient('instagram', 'test-token')
      expect(client).toBeInstanceOf(InstagramClient)
      expect(client.platform).toBe('instagram')
    })

    it('returns TwitterClient for twitter platform with ClientOptions', () => {
      const client = getPlatformClient('twitter', 'test-token', {
        clientKey: 'test-client-key',
        clientSecret: 'test-client-secret',
        refreshToken: 'test-refresh-token',
      })
      expect(client).toBeInstanceOf(TwitterClient)
      expect(client.platform).toBe('twitter')
    })

    it('returns LinkedInClient for linkedin platform with ClientOptions', () => {
      const client = getPlatformClient('linkedin', 'test-token', {
        clientKey: 'test-linkedin-key',
        clientSecret: 'test-linkedin-secret',
        refreshToken: 'test-linkedin-refresh',
      })
      expect(client).toBeInstanceOf(LinkedInClient)
      expect(client.platform).toBe('linkedin')
    })

    it('throws error for unknown platform', () => {
      expect(() => {
        getPlatformClient('unknown' as any, 'test-token')
      }).toThrow('Unsupported platform: unknown')
    })
  })

  describe('getPlatformConfig', () => {
    it('returns correct config for instagram', () => {
      const config = getPlatformConfig('instagram')
      expect(config.maxContentLength).toBe(2200)
      expect(config.maxMediaCount).toBe(10)
      expect(config.hashtagSupport).toBe(true)
      expect(config.supportedMediaTypes).toContain('image/jpeg')
    })

    it('returns correct config for twitter', () => {
      const config = getPlatformConfig('twitter')
      expect(config.maxContentLength).toBe(280)
      expect(config.maxMediaCount).toBe(4)
      expect(config.hashtagSupport).toBe(true)
    })

    it('returns correct config for linkedin', () => {
      const config = getPlatformConfig('linkedin')
      expect(config.maxContentLength).toBe(3000)
      expect(config.maxMediaCount).toBe(9)
      expect(config.hashtagSupport).toBe(true)
    })
  })

  describe('PLATFORM_CONFIGS', () => {
    it('contains all platform configs', () => {
      expect(PLATFORM_CONFIGS.instagram).toBeDefined()
      expect(PLATFORM_CONFIGS.twitter).toBeDefined()
      expect(PLATFORM_CONFIGS.linkedin).toBeDefined()
    })
  })
})
