import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwitterClient } from '../src/lib/twitter-client'

describe('twitter-client', () => {
  let client: TwitterClient
  const mockToken = 'test-twitter-token'

  beforeEach(() => {
    client = new TwitterClient(mockToken)
    vi.restoreAllMocks()
  })

  describe('post', () => {
    it('sends correct request to /tweets endpoint', async () => {
      const mockResponse = {
        data: { id: '1234567890', text: 'Test tweet' },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.post({
        content: 'Test tweet',
        mediaUrls: [],
        userId: 'user123',
      })

      expect(fetch).toHaveBeenCalledWith(
        'https://api.twitter.com/2/tweets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ text: 'Test tweet' }),
        })
      )

      expect(result.id).toBe('1234567890')
      expect(result.url).toBe('https://twitter.com/i/status/1234567890')
    })

    it('throws error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid request' }),
      })

      await expect(
        client.post({
          content: 'Test tweet',
          mediaUrls: [],
          userId: 'user123',
        })
      ).rejects.toThrow('Twitter API error')
    })
  })

  describe('getPostInsights', () => {
    it('parses public_metrics correctly', async () => {
      const mockResponse = {
        data: {
          id: '1234567890',
          public_metrics: {
            impression_count: 1000,
            like_count: 50,
            reply_count: 10,
            retweet_count: 20,
            bookmark_count: 5,
          },
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const insights = await client.getPostInsights('1234567890')

      expect(insights.impressions).toBe(1000)
      expect(insights.reach).toBe(1000)
      expect(insights.likes).toBe(50)
      expect(insights.comments).toBe(10)
      expect(insights.shares).toBe(20)
      expect(insights.saves).toBe(5)
    })

    it('throws error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(client.getPostInsights('invalid-id')).rejects.toThrow(
        'Twitter API error: 404'
      )
    })
  })

  describe('getUserProfile', () => {
    it('returns correct profile shape', async () => {
      const mockResponse = {
        data: {
          id: 'user123',
          username: 'testuser',
          name: 'Test User',
        },
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const profile = await client.getUserProfile('user123')

      expect(profile.id).toBe('user123')
      expect(profile.username).toBe('testuser')
      expect(profile.displayName).toBe('Test User')
    })

    it('throws error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(client.getUserProfile('user123')).rejects.toThrow(
        'Twitter API error: 401'
      )
    })
  })

  describe('refreshToken', () => {
    it('throws error indicating OAuth2 PKCE requirement', async () => {
      await expect(client.refreshToken()).rejects.toThrow(
        'Twitter OAuth2 token refresh requires client credentials'
      )
    })
  })
})
