import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwitterClient } from '../src/lib/twitter-client'
import { noopLogger } from '../src/lib/social-logger'

describe('twitter-client', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    vi.restoreAllMocks()
  })

  describe('post', () => {
    it('posts text-only tweet via fetchFn', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '1234567890', text: 'Hello world' } }),
      })

      const result = await client.post({
        content: 'Hello world',
        mediaUrls: [],
        userId: 'user123',
      })

      expect(result.id).toBe('1234567890')
      expect(result.url).toBe('https://twitter.com/i/status/1234567890')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.twitter.com/2/tweets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-abc',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ text: 'Hello world' }),
        })
      )
    })

    it('posts tweet with media upload', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      // Media fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: async () => new ArrayBuffer(100),
      })
      // INIT
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ media_id_string: 'media123' }),
      })
      // APPEND
      mockFetch.mockResolvedValueOnce({ ok: true })
      // FINALIZE
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ media_id_string: 'media123', expires_after_secs: 86400 }),
      })
      // Tweet creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '9876543210', text: 'With image' } }),
      })

      const result = await client.post({
        content: 'With image',
        mediaUrls: ['https://example.com/img.jpg'],
        userId: 'user123',
      })

      expect(result.id).toBe('9876543210')
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/img.jpg')
    })

    it('throws error on API failure', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(
        client.post({ content: 'Fail', mediaUrls: [], userId: 'user123' })
      ).rejects.toThrow('Twitter tweet creation failed')
    })
  })

  describe('postThread', () => {
    it('creates thread with in_reply_to_tweet_id chain', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'tweet1', text: 'First' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'tweet2', text: 'Second' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { id: 'tweet3', text: 'Third' } }),
        })

      const results = await client.postThread([
        { content: 'First', mediaUrls: [], userId: 'user123' },
        { content: 'Second', mediaUrls: [], userId: 'user123' },
        { content: 'Third', mediaUrls: [], userId: 'user123' },
      ])

      expect(results).toHaveLength(3)
      expect(results[0].id).toBe('tweet1')
      expect(results[1].id).toBe('tweet2')
      expect(results[2].id).toBe('tweet3')

      const calls = mockFetch.mock.calls
      expect(JSON.parse(calls[0][1].body as string)).toEqual({ text: 'First' })
      expect(JSON.parse(calls[1][1].body as string)).toEqual({
        text: 'Second',
        reply: { in_reply_to_tweet_id: 'tweet1' },
      })
      expect(JSON.parse(calls[2][1].body as string)).toEqual({
        text: 'Third',
        reply: { in_reply_to_tweet_id: 'tweet2' },
      })
    })
  })

  describe('getPostInsights', () => {
    it('parses public_metrics correctly', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '123',
            public_metrics: {
              impression_count: 5000,
              like_count: 100,
              reply_count: 20,
              retweet_count: 30,
              bookmark_count: 10,
            },
          },
        }),
      })

      const insights = await client.getPostInsights('123')

      expect(insights.impressions).toBe(5000)
      expect(insights.reach).toBe(5000)
      expect(insights.likes).toBe(100)
      expect(insights.comments).toBe(20)
      expect(insights.shares).toBe(30)
      expect(insights.saves).toBe(10)
    })

    it('throws error on API failure', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

      await expect(client.getPostInsights('invalid-id')).rejects.toThrow('Twitter API error: 404')
    })
  })

  describe('getUserProfile', () => {
    it('returns correct profile shape', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: { id: 'user123', username: 'testuser', name: 'Test User' },
        }),
      })

      const profile = await client.getUserProfile('user123')

      expect(profile.id).toBe('user123')
      expect(profile.username).toBe('testuser')
      expect(profile.displayName).toBe('Test User')
    })

    it('throws error on API failure', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })

      await expect(client.getUserProfile('user123')).rejects.toThrow('Twitter API error: 401')
    })
  })

  describe('refreshToken', () => {
    it('throws error without credentials', async () => {
      const client = new TwitterClient('test-token-abc', { fetchFn: mockFetch, logger: noopLogger })

      await expect(client.refreshToken()).rejects.toThrow(
        'Twitter OAuth2 refresh requires clientId, clientSecret, and refreshToken'
      )
    })

    it('refreshes token with valid credentials', async () => {
      const client = new TwitterClient('test-token-abc', {
        fetchFn: mockFetch,
        logger: noopLogger,
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        refreshToken: 'test-refresh-token',
      })

      // Mock the fetchFn to handle OAuth2 token refresh request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 7200,
        }),
      })

      const result = await client.refreshToken()

      expect(result.accessToken).toBe('new-access-token')
      expect(result.expiresIn).toBe(7200)
      // refreshToken is not returned in TokenRefreshResult, only accessToken and expiresIn
    })
  })
})
