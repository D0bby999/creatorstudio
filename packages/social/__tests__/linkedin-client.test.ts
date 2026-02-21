import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LinkedInClient } from '../src/lib/linkedin-client'

describe('linkedin-client', () => {
  let client: LinkedInClient
  let mockFetch: ReturnType<typeof vi.fn>
  const mockToken = 'test-linkedin-token'

  beforeEach(() => {
    mockFetch = vi.fn()
    client = new LinkedInClient(mockToken, undefined, { fetchFn: mockFetch })
    vi.restoreAllMocks()
  })

  describe('post', () => {
    it('sends correct request to /ugcPosts endpoint', async () => {
      const mockResponse = {
        id: 'urn:li:share:1234567890',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.post({
        content: 'Test LinkedIn post',
        mediaUrls: [],
        userId: 'user123',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/ugcPosts',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          }),
        })
      )

      expect(result.id).toBe('urn:li:share:1234567890')
      expect(result.url).toContain('linkedin.com/feed/update')
    })

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid request' }),
      })

      await expect(
        client.post({
          content: 'Test post',
          mediaUrls: [],
          userId: 'user123',
        })
      ).rejects.toThrow('LinkedIn API error')
    })
  })

  describe('getPostInsights', () => {
    it('parses likes and comments correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ paging: { total: 100 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ paging: { total: 25 } }),
        })

      const insights = await client.getPostInsights('urn:li:share:123')

      expect(insights.likes).toBe(100)
      expect(insights.comments).toBe(25)
      expect(insights.impressions).toBe(0)
      expect(insights.reach).toBe(0)
      expect(insights.shares).toBe(0)
      expect(insights.saves).toBe(0)
    })

    it('handles missing metrics gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })

      const insights = await client.getPostInsights('urn:li:share:123')

      expect(insights.likes).toBe(0)
      expect(insights.comments).toBe(0)
    })

    it('handles API errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
        })

      const insights = await client.getPostInsights('urn:li:share:123')

      expect(insights.likes).toBe(0)
      expect(insights.comments).toBe(0)
    })
  })

  describe('getUserProfile', () => {
    it('returns correct profile shape', async () => {
      const mockResponse = {
        id: 'user123',
        firstName: { localized: { en_US: 'John' } },
        lastName: { localized: { en_US: 'Doe' } },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const profile = await client.getUserProfile('user123')

      expect(profile.id).toBe('user123')
      expect(profile.username).toBe('user123')
      expect(profile.displayName).toBe('John Doe')
    })

    it('handles missing name fields', async () => {
      const mockResponse = {
        id: 'user123',
        firstName: {},
        lastName: {},
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const profile = await client.getUserProfile('user123')

      expect(profile.id).toBe('user123')
      expect(profile.displayName).toBeUndefined()
    })

    it('throws error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(client.getUserProfile('user123')).rejects.toThrow(
        'LinkedIn API error: 401'
      )
    })
  })

  describe('refreshToken', () => {
    it('throws error when credentials are missing', async () => {
      await expect(client.refreshToken()).rejects.toThrow(
        'LinkedIn token refresh requires clientId, clientSecret, and refreshToken'
      )
    })

    it('refreshes token successfully with credentials', async () => {
      const mockRefreshFetch = vi.fn()
      const clientWithCreds = new LinkedInClient(
        mockToken,
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          refreshToken: 'test-refresh-token',
        },
        { fetchFn: mockRefreshFetch }
      )

      const mockResponse = {
        access_token: 'new-access-token',
        expires_in: 5184000,
      }

      mockRefreshFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await clientWithCreds.refreshToken()

      expect(result.accessToken).toBe('new-access-token')
      expect(result.expiresIn).toBe(5184000)

      expect(mockRefreshFetch).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )
    })

    it('throws error on OAuth failure', async () => {
      const mockFailFetch = vi.fn()
      const clientWithCreds = new LinkedInClient(
        mockToken,
        {
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          refreshToken: 'invalid-refresh-token',
        },
        { fetchFn: mockFailFetch }
      )

      mockFailFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'invalid_grant' }),
      })

      await expect(clientWithCreds.refreshToken()).rejects.toThrow(
        'LinkedIn OAuth error'
      )
    })
  })
})
