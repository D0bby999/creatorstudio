import { z } from 'zod'

export type AgentRole = 'researcher' | 'writer' | 'designer' | 'planner'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  agentRole?: AgentRole
  timestamp: number
}

export interface AgentSession {
  id: string
  agentRole: AgentRole
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export interface AgentConfig {
  role: AgentRole
  systemPrompt: string
  description: string
  tools: string[]
}

export interface DesignSuggestion {
  template: string
  description: string
  platform: string
  dimensions: { width: number; height: number }
}

export interface TrendData {
  topic: string
  score: number
  platform: string
  relatedKeywords: string[]
}

export interface ContentDraft {
  title: string
  body: string
  hashtags: string[]
  platform: string
  characterCount: number
}

// Zod schemas for structured output
export const ContentPlanSchema = z.object({
  title: z.string(),
  platforms: z.array(z.enum(['instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'])),
  topics: z.array(z.string()),
  schedule: z.array(z.object({
    day: z.string(),
    platform: z.string(),
    contentType: z.string(),
  })),
})
export type ContentPlan = z.infer<typeof ContentPlanSchema>

export const PostDraftSchema = z.object({
  content: z.string(),
  hashtags: z.array(z.string()),
  platform: z.string(),
  characterCount: z.number(),
})
export type PostDraft = z.infer<typeof PostDraftSchema>

export const DesignBriefSchema = z.object({
  templateId: z.string(),
  colorScheme: z.array(z.string()),
  textContent: z.string(),
  dimensions: z.object({ width: z.number(), height: z.number() }),
})
export type DesignBrief = z.infer<typeof DesignBriefSchema>

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

// Multi-provider types
export type ProviderName = 'openai' | 'anthropic' | 'google'
export type ModelAlias = 'fast' | 'smart' | 'creative'
export type AiTask =
  | 'chat' | 'structured' | 'hashtags' | 'prediction' | 'image-prompt'
  | 'repurpose' | 'tone-adjust' | 'caption-variant' | 'translate'
  | 'moderation' | 'sentiment' | 'competitor-analysis'
  | 'embedding' | 'video-script' | 'design-layout'

// Token tracking types
export interface TokenUsageRecord {
  sessionId: string
  provider: ProviderName
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostUsd: number
  timestamp: number
  cacheReadTokens?: number
  reasoningTokens?: number
}

// Performance prediction schema for structured output
export const PerformancePredictionSchema = z.object({
  score: z.number().min(0).max(100),
  positiveFactors: z.array(z.string()),
  negativeFactors: z.array(z.string()),
  suggestions: z.array(z.string()),
})

// Agent callback types for observability
export interface AgentCallbacks {
  onStepFinish?: (event: { stepNumber: number; text: string; usage?: Record<string, unknown> }) => void | Promise<void>
  onToolCallStart?: (event: { toolName: string; args: unknown }) => void | Promise<void>
  onToolCallFinish?: (event: { toolName: string; result: unknown }) => void | Promise<void>
}

// Image generation types
export interface ImageGenerationOptions {
  model?: string
  width?: number
  height?: number
}

export interface ImageGenerationResult {
  url: string
  id: string
}

// Content scheduling types
export interface PostingTime {
  day: string
  hour: number
  score: number
}

// Brand knowledge types (shared across RAG modules)
export type BrandEntryType = 'guideline' | 'example' | 'voice' | 'audience'

export interface BrandEntry {
  id: string
  userId: string
  type: BrandEntryType
  content: string
  embedding: number[]
  createdAt: number
}

// Performance prediction types
export interface PerformancePrediction {
  score: number
  factors: string[]
  suggestions: string[]
}

// Hashtag generation types
export interface HashtagSuggestion {
  hashtags: string[]
  platform: string
  formatted: string
}
