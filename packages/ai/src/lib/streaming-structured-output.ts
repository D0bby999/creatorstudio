import { streamText } from 'ai'
import type { LanguageModel } from 'ai'
import { z } from 'zod'
import { resolveModel } from './model-registry'

export interface StreamedChunk<T> {
  partial: Partial<T> | null
  rawText: string
  done: boolean
}

export interface StreamStructuredOptions<T> {
  schema: z.ZodType<T>
  prompt: string
  system?: string
  model?: LanguageModel
}

/**
 * Attempts to parse partial JSON by auto-closing incomplete structures
 * Returns parsed object on success, null on failure
 */
export function tryParsePartialJson<T>(text: string): Partial<T> | null {
  try {
    return JSON.parse(text) as Partial<T>
  } catch {
    // Try auto-closing strategies
    const trimmed = text.trim().replace(/,\s*$/, '') // Remove trailing comma

    const strategies = [
      trimmed + '}',
      trimmed + ']}',
      trimmed + '}}',
      trimmed + ']}}'
    ]

    for (const candidate of strategies) {
      try {
        return JSON.parse(candidate) as Partial<T>
      } catch {
        continue
      }
    }

    return null
  }
}

/**
 * Parses and validates JSON against schema
 * Returns validated object on success, null on failure
 */
export function parseAndValidate<T>(text: string, schema: z.ZodType<T>): T | null {
  try {
    const parsed = JSON.parse(text)
    const result = schema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

/**
 * Streams structured output from LLM with incremental JSON parsing
 * Yields partial results as JSON structure is built up
 */
export async function* streamStructuredOutput<T>(
  options: StreamStructuredOptions<T>
): AsyncGenerator<StreamedChunk<T>> {
  const model = options.model ?? resolveModel('smart')

  const systemWithJsonInstruction = options.system
    ? `Respond with valid JSON matching the requested schema.\n\n${options.system}`
    : 'Respond with valid JSON matching the requested schema.'

  const result = streamText({
    model,
    prompt: options.prompt,
    system: systemWithJsonInstruction,
  })

  let accumulated = ''

  for await (const chunk of result.textStream) {
    accumulated += chunk

    // Attempt partial parse when we hit closing brackets
    if (accumulated.endsWith('}') || accumulated.endsWith(']')) {
      const partial = tryParsePartialJson<T>(accumulated)
      if (partial !== null) {
        yield {
          partial,
          rawText: accumulated,
          done: false,
        }
      }
    }
  }

  // Final validation
  const validated = parseAndValidate(accumulated, options.schema)

  yield {
    partial: validated,
    rawText: accumulated,
    done: true,
  }
}
