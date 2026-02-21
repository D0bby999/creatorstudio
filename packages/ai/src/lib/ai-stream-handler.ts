import { streamText } from 'ai'
import { resolveModelForTask } from './model-resolver'
import { getCurrentProvider } from './model-registry'
import { getAgentConfig } from './agent-config'
import { searchWeb, analyzeTrends, suggestDesign } from './ai-tools'
import { addMessage, getSession } from './session-memory'
import { trackUsage, estimateCost } from './token-usage-tracker'
import type { AgentRole } from '../types/ai-types'

const TOOL_MAP = {
  researcher: { searchWeb, analyzeTrends },
  writer: {},
  designer: { suggestDesign },
  planner: { searchWeb, analyzeTrends, suggestDesign },
}

/**
 * Handles AI streaming for a chat session
 * Supports abort via AbortSignal and tracks token usage on completion
 */
export async function handleAiStream(
  sessionId: string,
  userMessage: string,
  agentRole: AgentRole,
  options?: { abortSignal?: AbortSignal }
) {
  const config = getAgentConfig(agentRole)
  const session = await getSession(sessionId)

  if (!session) {
    throw new Error(`Session ${sessionId} not found`)
  }

  await addMessage(sessionId, { role: 'user', content: userMessage })

  const messages = session.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))

  const tools = TOOL_MAP[agentRole]
  const model = resolveModelForTask('chat')

  const result = streamText({
    model,
    system: config.systemPrompt,
    messages,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    maxSteps: 3,
    abortSignal: options?.abortSignal,
    onFinish: async ({ text, usage }) => {
      await addMessage(sessionId, {
        role: 'assistant',
        content: text,
        agentRole
      })

      // Track token usage (non-blocking)
      if (usage) {
        const provider = getCurrentProvider()
        const modelId = model.modelId ?? 'unknown'
        trackUsage(sessionId, {
          provider,
          model: modelId,
          promptTokens: usage.promptTokens ?? 0,
          completionTokens: usage.completionTokens ?? 0,
          totalTokens: (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0),
          estimatedCostUsd: estimateCost(
            { promptTokens: usage.promptTokens ?? 0, completionTokens: usage.completionTokens ?? 0 },
            modelId
          ),
          timestamp: Date.now(),
        }).catch(() => {}) // non-blocking
      }
    },
  })

  return result
}
