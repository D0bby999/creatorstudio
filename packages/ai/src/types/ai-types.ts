export type AgentRole = 'researcher' | 'writer' | 'designer'

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
