/**
 * AI generation logging middleware
 * Logs model, token usage, and latency per call (no prompt text — PII risk)
 */

import type { LanguageModelV3Middleware } from '@ai-sdk/provider'

export function createLoggingMiddleware(): LanguageModelV3Middleware {
  return {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate, params, model }) => {
      const start = Date.now()
      const result = await doGenerate()
      const latencyMs = Date.now() - start

      console.info('[ai]', {
        model: model.modelId,
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        finishReason: result.finishReason,
        latencyMs,
        timestamp: new Date().toISOString(),
      })

      return result
    },
  }
}
