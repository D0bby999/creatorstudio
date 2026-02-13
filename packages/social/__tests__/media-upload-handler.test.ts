import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadMedia, deleteMedia, getOptimizedUrl } from '../src/lib/media-upload-handler'

describe('media-upload-handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('uploadMedia', () => {
    it('calls Cloudinary upload endpoint', async () => {
      const mockResponse = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/abc123.jpg',
        public_id: 'abc123',
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const file = Buffer.from('test-image-data')
      const result = await uploadMedia(file, 'test.jpg', 'test-cloud', 'test-preset')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/auto/upload',
        expect.objectContaining({
          method: 'POST',
        })
      )

      expect(result.url).toBe('https://res.cloudinary.com/test/image/upload/abc123.jpg')
      expect(result.publicId).toBe('abc123')
    })

    it('throws error for empty file', async () => {
      const emptyFile = Buffer.from([])

      await expect(
        uploadMedia(emptyFile, 'test.jpg', 'test-cloud', 'test-preset')
      ).rejects.toThrow('File is empty')
    })

    it('throws error on upload failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Invalid file' } }),
      })

      const file = Buffer.from('test-data')

      await expect(
        uploadMedia(file, 'test.jpg', 'test-cloud', 'test-preset')
      ).rejects.toThrow('Cloudinary upload error')
    })
  })

  describe('deleteMedia', () => {
    it('calls Cloudinary destroy endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: 'ok' }),
      })

      await deleteMedia('abc123', 'test-cloud', 'test-key', 'test-secret')

      expect(fetch).toHaveBeenCalledWith(
        'https://api.cloudinary.com/v1_1/test-cloud/image/destroy',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('throws error on delete failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(
        deleteMedia('invalid-id', 'test-cloud', 'test-key', 'test-secret')
      ).rejects.toThrow('Cloudinary delete error: 404')
    })
  })

  describe('getOptimizedUrl', () => {
    it('builds correct URL with width transform', () => {
      const url = getOptimizedUrl('abc123', 'test-cloud', { width: 800 })

      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_800/abc123')
    })

    it('builds correct URL with format transform', () => {
      const url = getOptimizedUrl('abc123', 'test-cloud', { format: 'webp' })

      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/f_webp/abc123')
    })

    it('builds correct URL with multiple transforms', () => {
      const url = getOptimizedUrl('abc123', 'test-cloud', { width: 800, format: 'webp' })

      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_800,f_webp/abc123')
    })

    it('builds correct URL without transforms', () => {
      const url = getOptimizedUrl('abc123', 'test-cloud')

      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/abc123')
    })

    it('handles publicId with path segments', () => {
      const url = getOptimizedUrl('folder/subfolder/abc123', 'test-cloud', { width: 600 })

      expect(url).toBe('https://res.cloudinary.com/test-cloud/image/upload/w_600/folder/subfolder/abc123')
    })
  })
})
