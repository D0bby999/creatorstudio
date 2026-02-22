import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateContentPlan, generatePostDraft, generateDesignBrief } from '../src/lib/structured-output'
import { ContentPlanSchema, PostDraftSchema, DesignBriefSchema } from '../src/types/ai-types'

vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { object: vi.fn(() => 'mock-output-spec') },
}))

vi.mock('../src/lib/model-resolver', () => ({
  resolveModelForTask: vi.fn(() => ({ modelId: 'gpt-4o-mini', specificationVersion: 'v3' })),
}))

const { generateText } = await import('ai')

describe('structured-output', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateContentPlan', () => {
    it('should call generateText with ContentPlanSchema', async () => {
      const mockPlan = {
        title: 'Social Media Strategy',
        platforms: ['instagram', 'twitter'],
        topics: ['tech', 'design'],
        schedule: [
          { day: 'Monday', platform: 'instagram', contentType: 'post' },
        ],
      }

      vi.mocked(generateText).mockResolvedValue({
        output: mockPlan,
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        text: '',
        steps: [],
        response: {},
      } as any)

      const result = await generateContentPlan('Create a content plan for tech startup')

      expect(generateText).toHaveBeenCalledWith({
        model: expect.objectContaining({ modelId: 'gpt-4o-mini' }),
        output: 'mock-output-spec',
        prompt: 'Create a content plan: Create a content plan for tech startup',
      })
      expect(result).toEqual(mockPlan)
    })
  })

  describe('generatePostDraft', () => {
    it('should call generateText with PostDraftSchema and platform', async () => {
      const mockDraft = {
        content: 'Check out our new product!',
        hashtags: ['tech', 'innovation'],
        platform: 'instagram',
        characterCount: 27,
      }

      vi.mocked(generateText).mockResolvedValue({
        output: mockDraft,
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        text: '',
        steps: [],
        response: {},
      } as any)

      const result = await generatePostDraft('Promote new product launch', 'instagram')

      expect(generateText).toHaveBeenCalledWith({
        model: expect.objectContaining({ modelId: 'gpt-4o-mini' }),
        output: 'mock-output-spec',
        prompt: 'Write a instagram post: Promote new product launch',
      })
      expect(result).toEqual(mockDraft)
    })
  })

  describe('generateDesignBrief', () => {
    it('should call generateText with DesignBriefSchema', async () => {
      const mockBrief = {
        templateId: 'modern-card',
        colorScheme: ['#FF5733', '#3498DB'],
        textContent: 'Launch Announcement',
        dimensions: { width: 1080, height: 1080 },
      }

      vi.mocked(generateText).mockResolvedValue({
        output: mockBrief,
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        text: '',
        steps: [],
        response: {},
      } as any)

      const result = await generateDesignBrief('Create a design for product launch')

      expect(generateText).toHaveBeenCalledWith({
        model: expect.objectContaining({ modelId: 'gpt-4o-mini' }),
        output: 'mock-output-spec',
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
