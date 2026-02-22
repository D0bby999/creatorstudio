import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runMultiStepAgent } from '../src/lib/multi-step-agent'

vi.mock('ai', () => ({
  generateText: vi.fn(),
  stepCountIs: vi.fn((n) => `stepCountIs(${n})`),
}))

vi.mock('../src/lib/model-resolver', () => ({
  resolveModelForTask: vi.fn(() => ({ modelId: 'gpt-4o-mini', specificationVersion: 'v3' })),
}))

vi.mock('../src/lib/agent-config', () => ({
  getAgentConfig: vi.fn((role) => ({
    role,
    systemPrompt: `System prompt for ${role}`,
    description: `Description for ${role}`,
    tools: [],
  })),
}))

vi.mock('../src/lib/ai-tools', () => ({
  searchWeb: vi.fn(),
  analyzeTrends: vi.fn(),
  suggestDesign: vi.fn(),
}))

const { generateText } = await import('ai')

describe('multi-step-agent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('runMultiStepAgent', () => {
    it('should yield text step and usage step', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'This is a response',
        steps: [],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      } as any)

      const generator = runMultiStepAgent({
        role: 'writer',
        prompt: 'Write a caption',
      })

      const steps = []
      for await (const step of generator) {
        steps.push(step)
      }

      expect(steps).toHaveLength(2)
      expect(steps[0]).toEqual({
        type: 'text',
        content: 'This is a response',
      })
      expect(steps[1]).toEqual({
        type: 'usage',
        content: JSON.stringify({ inputTokens: 10, outputTokens: 20, totalTokens: 30 }),
      })
    })

    it('should yield tool-call and tool-result steps', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Here are the trends',
        steps: [
          {
            toolCalls: [
              {
                toolName: 'searchWeb',
                args: { query: 'social media trends' },
              },
            ],
            toolResults: [
              {
                toolName: 'searchWeb',
                result: { results: ['result1', 'result2'] },
              },
            ],
          },
        ],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      } as any)

      const generator = runMultiStepAgent({
        role: 'researcher',
        prompt: 'Research trends',
      })

      const steps = []
      for await (const step of generator) {
        steps.push(step)
      }

      expect(steps).toHaveLength(4)
      expect(steps[0]).toEqual({
        type: 'text',
        content: 'Here are the trends',
      })
      expect(steps[1]).toEqual({
        type: 'tool-call',
        content: JSON.stringify({ query: 'social media trends' }),
        toolName: 'searchWeb',
      })
      expect(steps[2]).toEqual({
        type: 'tool-result',
        content: JSON.stringify({ results: ['result1', 'result2'] }),
        toolName: 'searchWeb',
      })
      expect(steps[3]).toEqual({
        type: 'usage',
        content: JSON.stringify({ inputTokens: 10, outputTokens: 20, totalTokens: 30 }),
      })
    })

    it('should pass maxSteps=1 to generateText', async () => {
      vi.mocked(generateText).mockResolvedValue({
        text: 'Quick response',
        steps: [],
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        finishReason: 'stop',
      } as any)

      const generator = runMultiStepAgent({
        role: 'writer',
        prompt: 'Write quickly',
        maxSteps: 1,
      })

      for await (const step of generator) {
        // Consume generator
      }

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          stopWhen: 'stepCountIs(1)',
        })
      )
    })
  })
})
