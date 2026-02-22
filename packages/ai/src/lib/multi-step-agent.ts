import { generateText, stepCountIs } from 'ai'
import { resolveModelForTask } from './model-resolver'
import { getAgentConfig } from './agent-config'
import { searchWeb, analyzeTrends, suggestDesign } from './ai-tools'
import type { AgentRole, AgentCallbacks } from '../types/ai-types'

export interface AgentStep {
  type: 'text' | 'tool-call' | 'tool-result' | 'usage'
  content: string
  toolName?: string
}

const TOOL_MAP = {
  researcher: { searchWeb, analyzeTrends },
  writer: {},
  designer: { suggestDesign },
  planner: { searchWeb, analyzeTrends, suggestDesign },
}

export async function* runMultiStepAgent(params: {
  role: AgentRole
  prompt: string
  maxSteps?: number
  callbacks?: AgentCallbacks
}): AsyncGenerator<AgentStep> {
  const config = getAgentConfig(params.role)
  const tools = TOOL_MAP[params.role] ?? {}

  const result = await generateText({
    model: resolveModelForTask('chat'),
    system: config.systemPrompt,
    prompt: params.prompt,
    tools: Object.keys(tools).length > 0 ? tools : undefined,
    stopWhen: stepCountIs(params.maxSteps ?? 5),
    onStepFinish: params.callbacks?.onStepFinish,
  })

  // Yield text response
  if (result.text) {
    yield { type: 'text', content: result.text }
  }

  // Yield tool calls and results from steps
  const steps = result.steps ?? []
  for (const step of steps) {
    const toolCalls = (step as any).toolCalls ?? []
    const toolResults = (step as any).toolResults ?? []

    for (const toolCall of toolCalls) {
      yield { type: 'tool-call', content: JSON.stringify(toolCall.args), toolName: toolCall.toolName }
    }

    for (const toolResult of toolResults) {
      yield { type: 'tool-result', content: JSON.stringify(toolResult.result), toolName: toolResult.toolName }
    }
  }

  // Yield usage info if available
  if (result.usage) {
    yield { type: 'usage', content: JSON.stringify(result.usage) }
  }
}
