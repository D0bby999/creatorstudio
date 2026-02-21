/**
 * AI generation logging middleware
 * Logs model, token usage, and latency per call (no prompt text — PII risk)
 */

import type { LanguageModelV1Middleware } from 'ai'

export function createLoggingMiddleware(): LanguageModelV1Middleware {
  return {
    wrapGenerate: async ({ doGenerate, params, model }) => {
      const start = Date.now()
      const result = await doGenerate()
      const latencyMs = Date.now() - start

      console.info('[ai]', {
        model: model.modelId,
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        finishReason: result.finishReason,
        latencyMs,
        timestamp: new Date().toISOString(),
      })

      return result
    },
  }
}
