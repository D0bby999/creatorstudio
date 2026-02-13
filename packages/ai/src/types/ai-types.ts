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
