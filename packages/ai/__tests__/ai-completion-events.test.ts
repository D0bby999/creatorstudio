import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createEventEmitter,
  withCompletionEvent,
  type EventEmitterClient,
} from '../src/lib/ai-completion-events'

describe('ai-completion-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEventEmitter', () => {
    it('should call inngestClient.send when provided', () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }

      const emitter = createEventEmitter(mockClient)
      const event = {
        name: 'ai/task.completed' as const,
        data: {
          taskType: 'chat',
          model: 'gpt-4',
          durationMs: 100,
        },
      }

      emitter.emit(event)

      expect(mockClient.send).toHaveBeenCalledWith(event)
    })

    it('should not throw when client.send rejects', () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockRejectedValue(new Error('Network error')),
      }

      const emitter = createEventEmitter(mockClient)
      const event = {
        name: 'ai/task.completed' as const,
        data: {
          taskType: 'chat',
          model: 'gpt-4',
          durationMs: 100,
        },
      }

      expect(() => emitter.emit(event)).not.toThrow()
    })

    it('should log to console when no client provided', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const emitter = createEventEmitter()
      const event = {
        name: 'ai/task.completed' as const,
        data: {
          taskType: 'structured',
          model: 'claude-3',
          durationMs: 250,
        },
      }

      emitter.emit(event)

      expect(consoleSpy).toHaveBeenCalledWith('[ai:event]', JSON.stringify(event))
      consoleSpy.mockRestore()
    })

    it('should handle both success and failure events', () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }

      const emitter = createEventEmitter(mockClient)

      const successEvent = {
        name: 'ai/task.completed' as const,
        data: { taskType: 'chat', model: 'gpt-4', durationMs: 100 },
      }

      const failureEvent = {
        name: 'ai/task.failed' as const,
        data: {
          taskType: 'chat',
          model: 'gpt-4',
          durationMs: 50,
          error: 'Rate limit exceeded',
        },
      }

      emitter.emit(successEvent)
      emitter.emit(failureEvent)

      expect(mockClient.send).toHaveBeenCalledWith(successEvent)
      expect(mockClient.send).toHaveBeenCalledWith(failureEvent)
      expect(mockClient.send).toHaveBeenCalledTimes(2)
    })
  })

  describe('withCompletionEvent', () => {
    it('should emit success event with duration', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const emitter = createEventEmitter(mockClient)

      const fn = vi.fn().mockResolvedValue('success')
      const metadata = {
        taskType: 'hashtags',
        model: 'gpt-4o-mini',
        sessionId: 'test-session',
      }

      const result = await withCompletionEvent(fn, metadata, emitter)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalled()
      expect(mockClient.send).toHaveBeenCalledWith({
        name: 'ai/task.completed',
        data: expect.objectContaining({
          taskType: 'hashtags',
          model: 'gpt-4o-mini',
          sessionId: 'test-session',
          durationMs: expect.any(Number),
        }),
      })
    })

    it('should emit failure event on rejection and re-throw', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const emitter = createEventEmitter(mockClient)

      const error = new Error('API error')
      const fn = vi.fn().mockRejectedValue(error)
      const metadata = {
        taskType: 'prediction',
        model: 'claude-3-5-sonnet',
      }

      await expect(withCompletionEvent(fn, metadata, emitter)).rejects.toThrow('API error')

      expect(mockClient.send).toHaveBeenCalledWith({
        name: 'ai/task.failed',
        data: expect.objectContaining({
          taskType: 'prediction',
          model: 'claude-3-5-sonnet',
          durationMs: expect.any(Number),
          error: 'API error',
        }),
      })
    })

    it('should work without emitter', async () => {
      const fn = vi.fn().mockResolvedValue('result')
      const metadata = {
        taskType: 'chat',
        model: 'gpt-4',
      }

      const result = await withCompletionEvent(fn, metadata)
      expect(result).toBe('result')
    })

    it('should include optional userId in event', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const emitter = createEventEmitter(mockClient)

      const fn = vi.fn().mockResolvedValue('done')
      const metadata = {
        taskType: 'repurpose',
        model: 'gpt-4o',
        userId: 'user-123',
        sessionId: 'session-456',
      }

      await withCompletionEvent(fn, metadata, emitter)

      expect(mockClient.send).toHaveBeenCalledWith({
        name: 'ai/task.completed',
        data: expect.objectContaining({
          userId: 'user-123',
          sessionId: 'session-456',
        }),
      })
    })

    it('should record durationMs > 0', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const emitter = createEventEmitter(mockClient)

      const fn = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'done'
      })

      const metadata = { taskType: 'chat', model: 'gpt-4' }
      await withCompletionEvent(fn, metadata, emitter)

      const callData = vi.mocked(mockClient.send).mock.calls[0][0].data
      expect(callData.durationMs).toBeGreaterThan(0)
    })

    it('should handle non-Error thrown values', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockResolvedValue(undefined),
      }
      const emitter = createEventEmitter(mockClient)

      const fn = vi.fn().mockRejectedValue('string error')
      const metadata = { taskType: 'chat', model: 'gpt-4' }

      await expect(withCompletionEvent(fn, metadata, emitter)).rejects.toBe('string error')

      expect(mockClient.send).toHaveBeenCalledWith({
        name: 'ai/task.failed',
        data: expect.objectContaining({
          error: 'string error',
        }),
      })
    })

    it('should not break if send fails (fire-and-forget)', async () => {
      const mockClient: EventEmitterClient = {
        send: vi.fn().mockRejectedValue(new Error('Send failed')),
      }
      const emitter = createEventEmitter(mockClient)

      const fn = vi.fn().mockResolvedValue('success')
      const metadata = { taskType: 'chat', model: 'gpt-4' }

      const result = await withCompletionEvent(fn, metadata, emitter)
      expect(result).toBe('success')
    })
  })
})
