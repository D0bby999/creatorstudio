export type AiEventType = 'ai/task.completed' | 'ai/task.failed'

export interface AiCompletionEventData {
  taskType: string
  sessionId?: string
  userId?: string
  model: string
  durationMs: number
  tokenUsage?: { input: number; output: number }
  error?: string
}

export interface AiCompletionEvent {
  name: AiEventType
  data: AiCompletionEventData
}

export interface EventEmitterClient {
  send: (event: AiCompletionEvent) => Promise<unknown>
}

export interface EventEmitter {
  emit: (event: AiCompletionEvent) => void
}

/**
 * Creates an event emitter for AI completion events
 * If inngestClient provided, sends to Inngest (fire-and-forget)
 * Otherwise logs to console
 */
export function createEventEmitter(inngestClient?: EventEmitterClient): EventEmitter {
  return {
    emit(event: AiCompletionEvent): void {
      if (inngestClient) {
        inngestClient.send(event).catch(() => {})
      } else {
        console.info('[ai:event]', JSON.stringify(event))
      }
    },
  }
}

/**
 * Wraps async function with completion event emission
 * Tracks duration and emits success/failure events
 */
export async function withCompletionEvent<T>(
  fn: () => Promise<T>,
  metadata: {
    taskType: string
    sessionId?: string
    userId?: string
    model: string
  },
  emitter?: EventEmitter
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const durationMs = Date.now() - startTime

    emitter?.emit({
      name: 'ai/task.completed',
      data: {
        ...metadata,
        durationMs,
      },
    })

    return result
  } catch (error) {
    const durationMs = Date.now() - startTime

    emitter?.emit({
      name: 'ai/task.failed',
      data: {
        ...metadata,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
      },
    })

    throw error
  }
}
