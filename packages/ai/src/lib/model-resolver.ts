/**
 * Task-based model resolver
 * Maps AI tasks to model aliases and applies middleware wrapping
 */

import { wrapLanguageModel } from 'ai'
import type { LanguageModel } from 'ai'
import { resolveModel, createProviderModel } from './model-registry'
import { createCacheMiddleware } from './ai-cache-middleware'
import { createLoggingMiddleware } from './ai-logging-middleware'
import type { AiTask, ModelAlias, ProviderName } from '../types/ai-types'

const TASK_ALIAS_MAP: Record<AiTask, ModelAlias> = {
  chat: 'fast',
  structured: 'fast',
  hashtags: 'fast',
  prediction: 'smart',
  'image-prompt': 'creative',
  repurpose: 'fast',
  'tone-adjust': 'fast',
  'caption-variant': 'creative',
  translate: 'fast',
  moderation: 'fast',
  sentiment: 'fast',
  'competitor-analysis': 'smart',
  embedding: 'fast',
  'video-script': 'creative',
}

// Tasks that benefit from caching (deterministic structured output)
const CACHEABLE_TASKS: Set<AiTask> = new Set(['structured', 'prediction'])

// Per-task env override keys: AI_MODEL_CHAT=anthropic:claude-3-5-sonnet
const TASK_ENV_KEYS: Record<AiTask, string> = {
  chat: 'AI_MODEL_CHAT',
  structured: 'AI_MODEL_STRUCTURED',
  hashtags: 'AI_MODEL_HASHTAGS',
  prediction: 'AI_MODEL_PREDICTION',
  'image-prompt': 'AI_MODEL_IMAGE_PROMPT',
  repurpose: 'AI_MODEL_REPURPOSE',
  'tone-adjust': 'AI_MODEL_TONE_ADJUST',
  'caption-variant': 'AI_MODEL_CAPTION_VARIANT',
  translate: 'AI_MODEL_TRANSLATE',
  moderation: 'AI_MODEL_MODERATION',
  sentiment: 'AI_MODEL_SENTIMENT',
  'competitor-analysis': 'AI_MODEL_COMPETITOR_ANALYSIS',
  embedding: 'AI_MODEL_EMBEDDING',
  'video-script': 'AI_MODEL_VIDEO_SCRIPT',
}

const loggingMiddleware = createLoggingMiddleware()
const cacheMiddleware = createCacheMiddleware()

/**
 * Resolves the best model for a given AI task
 * Applies middleware chain: logging (always) + cache (structured/prediction only)
 */
export function resolveModelForTask(task: AiTask): LanguageModel {
  // Check per-task env override (format: "provider:model-id")
  const envOverride = process.env[TASK_ENV_KEYS[task]]
  let baseModel: LanguageModel

  if (envOverride?.includes(':')) {
    const [providerStr, modelId] = envOverride.split(':') as [ProviderName, string]
    baseModel = modelId ? createProviderModel(providerStr, modelId) : resolveModel(TASK_ALIAS_MAP[task])
  } else {
    baseModel = resolveModel(TASK_ALIAS_MAP[task])
  }

  // Apply middleware: logging always, cache only for structured/prediction
  const logged = wrapLanguageModel({ model: baseModel, middleware: loggingMiddleware })

  if (CACHEABLE_TASKS.has(task)) {
    return wrapLanguageModel({ model: logged, middleware: cacheMiddleware })
  }

  return logged
}
