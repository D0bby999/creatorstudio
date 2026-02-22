import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Mock dependencies
vi.mock('ai', () => ({
  streamText: vi.fn(),
}))
vi.mock('../src/lib/model-registry', () => ({
  resolveModel: vi.fn().mockReturnValue({ modelId: 'test-model' }),
}))

import { streamText } from 'ai'
import {
  tryParsePartialJson,
  parseAndValidate,
  streamStructuredOutput,
} from '../src/lib/streaming-structured-output'

describe('streaming-structured-output', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('tryParsePartialJson', () => {
    it('should parse complete JSON successfully', () => {
      const result = tryParsePartialJson<{ a: number }>('{"a":1}')
      expect(result).toEqual({ a: 1 })
    })

    it('should parse nested complete JSON', () => {
      const result = tryParsePartialJson<{ user: { name: string } }>('{"user":{"name":"Alice"}}')
      expect(result).toEqual({ user: { name: 'Alice' } })
    })

    it('should auto-close incomplete JSON with missing }', () => {
      const result = tryParsePartialJson<{ a: number }>('{"a":1')
      expect(result).toEqual({ a: 1 })
    })

    it('should auto-close incomplete JSON with trailing comma', () => {
      const result = tryParsePartialJson<{ a: number; b: string }>('{"a":1,"b":"hello",')
      expect(result).toEqual({ a: 1, b: 'hello' })
    })

    it('should auto-close nested object', () => {
      const result = tryParsePartialJson<{ user: { id: number } }>('{"user":{"id":42')
      expect(result).toEqual({ user: { id: 42 } })
    })

    it('should auto-close array structure', () => {
      const result = tryParsePartialJson<{ items: number[] }>('{"items":[1,2,3')
      expect(result).toEqual({ items: [1, 2, 3] })
    })

    it('should return null for garbage input', () => {
      const result = tryParsePartialJson('not json at all')
      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      const result = tryParsePartialJson('')
      expect(result).toBeNull()
    })

    it('should return null for unclosable structure', () => {
      const result = tryParsePartialJson('{"a":')
      expect(result).toBeNull()
    })
  })

  describe('parseAndValidate', () => {
    const schema = z.object({
      title: z.string(),
      count: z.number(),
    })

    it('should parse and validate correct JSON', () => {
      const result = parseAndValidate('{"title":"Test","count":42}', schema)
      expect(result).toEqual({ title: 'Test', count: 42 })
    })

    it('should return null for schema-invalid JSON', () => {
      const result = parseAndValidate('{"title":"Test","count":"not-a-number"}', schema)
      expect(result).toBeNull()
    })

    it('should return null for missing required fields', () => {
      const result = parseAndValidate('{"title":"Test"}', schema)
      expect(result).toBeNull()
    })

    it('should return null for malformed JSON', () => {
      const result = parseAndValidate('not json', schema)
      expect(result).toBeNull()
    })

    it('should validate with extra fields allowed', () => {
      const result = parseAndValidate('{"title":"Test","count":42,"extra":"field"}', schema)
      expect(result).toEqual({ title: 'Test', count: 42 })
    })
  })

  describe('streamStructuredOutput', () => {
    it('should yield partial results as chunks arrive', async () => {
      async function* mockTextStream(chunks: string[]) {
        for (const chunk of chunks) yield chunk
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream(['{"title":', '"hello"}']) as any,
      } as any)

      const schema = z.object({ title: z.string() })
      const stream = streamStructuredOutput({ schema, prompt: 'test' })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
      expect(chunks[chunks.length - 1].done).toBe(true)
      expect(chunks[chunks.length - 1].partial).toEqual({ title: 'hello' })
    })

    it('should include system JSON instruction', async () => {
      async function* mockTextStream() {
        yield '{"result":true}'
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream() as any,
      } as any)

      const schema = z.object({ result: z.boolean() })
      const stream = streamStructuredOutput({
        schema,
        prompt: 'test',
        system: 'custom system',
      })

      // Consume stream
      for await (const _ of stream) {
        // no-op
      }

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Respond with valid JSON'),
        })
      )
      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('custom system'),
        })
      )
    })

    it('should yield partial on closing brace', async () => {
      async function* mockTextStream() {
        yield '{"a":'
        yield '1}'
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream() as any,
      } as any)

      const schema = z.object({ a: z.number() })
      const stream = streamStructuredOutput({ schema, prompt: 'test' })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      expect(chunks.some((c) => c.partial !== null && !c.done)).toBe(true)
    })

    it('should validate final chunk with schema', async () => {
      async function* mockTextStream() {
        yield '{"valid":true,"num":42}'
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream() as any,
      } as any)

      const schema = z.object({ valid: z.boolean(), num: z.number() })
      const stream = streamStructuredOutput({ schema, prompt: 'test' })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const finalChunk = chunks[chunks.length - 1]
      expect(finalChunk.done).toBe(true)
      expect(finalChunk.partial).toEqual({ valid: true, num: 42 })
    })

    it('should use provided model', async () => {
      async function* mockTextStream() {
        yield '{"x":1}'
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream() as any,
      } as any)

      const customModel = { modelId: 'custom-model' } as any
      const schema = z.object({ x: z.number() })
      const stream = streamStructuredOutput({ schema, prompt: 'test', model: customModel })

      for await (const _ of stream) {
        // no-op
      }

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: customModel,
        })
      )
    })

    it('should accumulate rawText correctly', async () => {
      async function* mockTextStream() {
        yield '{"part1":'
        yield '"value1",'
        yield '"part2":'
        yield '"value2"}'
      }

      vi.mocked(streamText).mockReturnValue({
        textStream: mockTextStream() as any,
      } as any)

      const schema = z.object({ part1: z.string(), part2: z.string() })
      const stream = streamStructuredOutput({ schema, prompt: 'test' })

      const chunks = []
      for await (const chunk of stream) {
        chunks.push(chunk)
      }

      const finalChunk = chunks[chunks.length - 1]
      expect(finalChunk.rawText).toBe('{"part1":"value1","part2":"value2"}')
    })
  })
})
