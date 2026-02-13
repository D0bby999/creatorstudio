import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getAgentConfig } from './agent-config'
import { searchWeb, analyzeTrends, suggestDesign } from './ai-tools'
import { addMessage, getSession } from './session-memory'
import type { AgentRole } from '../types/ai-types'

// Map agent roles to their available tools
const TOOL_MAP = {
  researcher: { searchWeb, analyzeTrends },
  writer: {},
  designer: { suggestDesign },
  planner: { searchWeb, analyzeTrends, suggestDesign },
}

/**
 * Handles AI streaming for a chat session
 * @param sessionId - Session identifier
 * @param userMessage - User's message content
 * @param agentRole - Active agent role
 * @returns Streaming text result from Vercel AI SDK
 */
export async function handleAiStream(
  sessionId: string,
  userMessage: string,
  agentRole: AgentRole
) {
  const config = getAgentConfig(agentRole)
  const session = getSession(sessionId)

  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  // Add user message to session
  addMessage(sessionId, { role: 'user', content: userMessage })

  // Build message history from session
  const messages = session.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))

  // Get tools for this agent
  const tools = TOOL_MAP[agentRole]

  // Stream response from OpenAI
  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: config.systemPrompt,
    messages,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    maxSteps: 3,
    onFinish: ({ text }) => {
      // Save assistant's response to session
      addMessage(sessionId, {
        role: 'assistant',
        content: text,
        agentRole
      })
    },
  })

  return result
}
