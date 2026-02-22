import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('ai', () => ({
  generateText: vi.fn(),
}))
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(),
}))

import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { analyzeImage, generateAltText } from '../src/lib/image-analyzer'

describe('image-analyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock implementation
    const mockModel = vi.fn((modelId: string) => ({ modelId }))
    vi.mocked(createOpenAI).mockReturnValue(mockModel as any)

    vi.mocked(generateText).mockResolvedValue({
      text: 'Mock analysis result',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    } as any)
  })

  describe('analyzeImage', () => {
    it('should send image URL in message', async () => {
      const imageUrl = 'https://example.com/image.jpg'
      await analyzeImage(imageUrl, 'describe')

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image',
                  image: new URL(imageUrl),
                }),
              ]),
            }),
          ]),
        })
      )
    })

    it('should send image buffer in message', async () => {
      const imageBuffer = Buffer.from('fake-image-data')
      await analyzeImage(imageBuffer, 'ocr')

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'image',
                  image: imageBuffer,
                }),
              ]),
            }),
          ]),
        })
      )
    })

    it('should use alt-text task prompt', async () => {
      await analyzeImage('https://example.com/img.jpg', 'alt-text')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const textContent = call.messages[0].content.find((c: any) => c.type === 'text')

      expect(textContent.text).toContain('alt text')
      expect(textContent.text).toContain('125 characters')
    })

    it('should use describe task prompt', async () => {
      await analyzeImage('https://example.com/img.jpg', 'describe')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const textContent = call.messages[0].content.find((c: any) => c.type === 'text')

      expect(textContent.text).toContain('detail')
      expect(textContent.text).toContain('colors')
    })

    it('should use ocr task prompt', async () => {
      await analyzeImage('https://example.com/img.jpg', 'ocr')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const textContent = call.messages[0].content.find((c: any) => c.type === 'text')

      expect(textContent.text).toContain('Extract')
      expect(textContent.text).toContain('text')
    })

    it('should use content-tags task prompt', async () => {
      await analyzeImage('https://example.com/img.jpg', 'content-tags')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const textContent = call.messages[0].content.find((c: any) => c.type === 'text')

      expect(textContent.text).toContain('tags')
      expect(textContent.text).toContain('categories')
    })

    it('should use gpt-4o model', async () => {
      await analyzeImage('https://example.com/img.jpg', 'describe')

      const mockOpenAI = vi.mocked(createOpenAI).mock.results[0].value
      expect(mockOpenAI).toHaveBeenCalledWith('gpt-4o')
    })

    it('should create OpenAI client with API key from env', async () => {
      await analyzeImage('https://example.com/img.jpg', 'alt-text')

      expect(createOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: process.env.OPENAI_API_KEY,
        })
      )
    })

    it('should return text from generateText result', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'A detailed analysis of the image',
      } as any)

      const result = await analyzeImage('https://example.com/img.jpg', 'describe')
      expect(result).toBe('A detailed analysis of the image')
    })

    it('should handle different result text values', async () => {
      const testCases = [
        'Short alt text',
        'A very long description with multiple sentences and details about colors, composition, and mood.',
        'Text extracted:\nLine 1\nLine 2\nLine 3',
        'nature, landscape, sunset, orange, peaceful, scenic',
      ]

      for (const expectedText of testCases) {
        vi.mocked(generateText).mockResolvedValue({ text: expectedText } as any)
        const result = await analyzeImage(Buffer.from('img'), 'describe')
        expect(result).toBe(expectedText)
      }
    })
  })

  describe('generateAltText', () => {
    it('should delegate to analyzeImage with alt-text task', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'A scenic mountain landscape',
      } as any)

      const result = await generateAltText('https://example.com/mountain.jpg')

      expect(result).toBe('A scenic mountain landscape')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const textContent = call.messages[0].content.find((c: any) => c.type === 'text')
      expect(textContent.text).toContain('alt text')
    })

    it('should work with buffer input', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Product photo on white background',
      } as any)

      const buffer = Buffer.from('product-image')
      const result = await generateAltText(buffer)

      expect(result).toBe('Product photo on white background')

      const call = vi.mocked(generateText).mock.calls[0][0]
      const imageContent = call.messages[0].content.find((c: any) => c.type === 'image')
      expect(imageContent.image).toBe(buffer)
    })

    it('should work with URL input', async () => {
      const url = 'https://cdn.example.com/photo.png'
      await generateAltText(url)

      const call = vi.mocked(generateText).mock.calls[0][0]
      const imageContent = call.messages[0].content.find((c: any) => c.type === 'image')
      expect(imageContent.image).toEqual(new URL(url))
    })
  })
})
