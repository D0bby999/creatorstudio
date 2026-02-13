import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateContentPlan, generatePostDraft, generateDesignBrief } from '../src/lib/structured-output'
import { ContentPlanSchema, PostDraftSchema, DesignBriefSchema } from '../src/types/ai-types'

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}))

const { generateObject } = await import('ai')

describe('structured-output', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateContentPlan', () => {
    it('should call generateObject with ContentPlanSchema', async () => {
      const mockPlan = {
        title: 'Social Media Strategy',
        platforms: ['instagram', 'twitter'],
        topics: ['tech', 'design'],
        schedule: [
          { day: 'Monday', platform: 'instagram', contentType: 'post' },
        ],
      }

      vi.mocked(generateObject).mockResolvedValue({
        object: mockPlan,
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any)

      const result = await generateContentPlan('Create a content plan for tech startup')

      expect(generateObject).toHaveBeenCalledWith({
        model: 'mocked-model',
        schema: ContentPlanSchema,
        prompt: 'Create a content plan: Create a content plan for tech startup',
      })
      expect(result).toEqual(mockPlan)
    })
  })

  describe('generatePostDraft', () => {
    it('should call generateObject with PostDraftSchema and platform', async () => {
      const mockDraft = {
        content: 'Check out our new product!',
        hashtags: ['tech', 'innovation'],
        platform: 'instagram',
        characterCount: 27,
      }

      vi.mocked(generateObject).mockResolvedValue({
        object: mockDraft,
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any)

      const result = await generatePostDraft('Promote new product launch', 'instagram')

      expect(generateObject).toHaveBeenCalledWith({
        model: 'mocked-model',
        schema: PostDraftSchema,
        prompt: 'Write a instagram post: Promote new product launch',
      })
      expect(result).toEqual(mockDraft)
    })
  })

  describe('generateDesignBrief', () => {
    it('should call generateObject with DesignBriefSchema', async () => {
      const mockBrief = {
        templateId: 'modern-card',
        colorScheme: ['#FF5733', '#3498DB'],
        textContent: 'Launch Announcement',
        dimensions: { width: 1080, height: 1080 },
      }

      vi.mocked(generateObject).mockResolvedValue({
        object: mockBrief,
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      } as any)

      const result = await generateDesignBrief('Create a design for product launch')

      expect(generateObject).toHaveBeenCalledWith({
        model: 'mocked-model',
        schema: DesignBriefSchema,
        prompt: 'Create a design brief: Create a design for product launch',
      })
      expect(result).toEqual(mockBrief)
    })
  })

  describe('ContentPlanSchema validation', () => {
    it('should validate correct shape', () => {
      const validPlan = {
        title: 'Test Plan',
        platforms: ['instagram'],
        topics: ['tech'],
        schedule: [{ day: 'Monday', platform: 'instagram', contentType: 'post' }],
      }

      const result = ContentPlanSchema.safeParse(validPlan)
      expect(result.success).toBe(true)
    })

    it('should reject missing fields', () => {
      const invalidPlan = {
        title: 'Test Plan',
        // Missing platforms, topics, schedule
      }

      const result = ContentPlanSchema.safeParse(invalidPlan)
      expect(result.success).toBe(false)
    })
  })
})
