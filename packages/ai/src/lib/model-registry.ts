/**
 * Multi-provider model registry
 * Manages available AI providers and resolves model aliases to provider-specific models
 */

import type { LanguageModel } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import type { ProviderName, ModelAlias } from '../types/ai-types'

interface ProviderModelMap {
  fast: string
  smart: string
  creative: string
}

const PROVIDER_MODELS: Record<ProviderName, ProviderModelMap> = {
  openai: {
    fast: 'gpt-4o-mini',
    smart: 'gpt-4o',
    creative: 'gpt-4o',
  },
  anthropic: {
    fast: 'claude-3-5-haiku-latest',
    smart: 'claude-3-5-sonnet-latest',
    creative: 'claude-3-5-sonnet-latest',
  },
  google: {
    fast: 'gemini-2.0-flash',
    smart: 'gemini-2.0-pro',
    creative: 'gemini-2.0-pro',
  },
}

const PROVIDER_ENV_KEYS: Record<ProviderName, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
}

const PROVIDER_PRIORITY: ProviderName[] = ['openai', 'anthropic', 'google']

// Provider SDKs v3 return LanguageModelV3 — runtime-compatible with LanguageModelV1
// Cast needed because ai@4.x types haven't aligned yet
const MODEL_CREATORS: Record<ProviderName, (modelId: string) => LanguageModel> = {
  openai: (id) => openai(id),
  anthropic: (id) => anthropic(id) as unknown as LanguageModel,
  google: (id) => google(id) as unknown as LanguageModel,
}

/** Returns list of providers with API keys configured */
export function getAvailableProviders(): ProviderName[] {
  return PROVIDER_PRIORITY.filter(
    (provider) => !!process.env[PROVIDER_ENV_KEYS[provider]]
  )
}

/** Creates a LanguageModel instance for a specific provider + model ID */
export function createProviderModel(provider: ProviderName, modelId: string): LanguageModel {
  return MODEL_CREATORS[provider](modelId)
}

/**
 * Resolves a model alias to a LanguageModel using the best available provider
 * Respects AI_DEFAULT_PROVIDER env override
 */
export function resolveModel(alias: ModelAlias = 'fast'): LanguageModel {
  const defaultProvider = process.env.AI_DEFAULT_PROVIDER as ProviderName | undefined
  const defaultModel = process.env.AI_DEFAULT_MODEL

  // If specific model override is set, parse "provider:model" format
  if (defaultModel?.includes(':')) {
    const [providerStr, modelId] = defaultModel.split(':') as [ProviderName, string]
    if (MODEL_CREATORS[providerStr] && modelId) {
      return createProviderModel(providerStr, modelId)
    }
  }

  const available = getAvailableProviders()
  if (available.length === 0) {
    throw new Error(
      'No AI provider configured. Set at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY'
    )
  }

  // Use default provider if available, otherwise first in priority
  const provider = defaultProvider && available.includes(defaultProvider)
    ? defaultProvider
    : available[0]

  const modelId = PROVIDER_MODELS[provider][alias]
  return createProviderModel(provider, modelId)
}

/** Returns model ID string for a provider + alias (used for token tracking) */
export function getModelId(provider: ProviderName, alias: ModelAlias = 'fast'): string {
  return PROVIDER_MODELS[provider][alias]
}

/** Gets the current default provider name */
export function getCurrentProvider(): ProviderName {
  const defaultProvider = process.env.AI_DEFAULT_PROVIDER as ProviderName | undefined
  const available = getAvailableProviders()
  if (defaultProvider && available.includes(defaultProvider)) return defaultProvider
  return available[0] || 'openai'
}
