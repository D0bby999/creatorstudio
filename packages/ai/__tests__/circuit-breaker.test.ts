import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  CircuitBreaker,
  getOrCreateCircuit,
  callWithFailover,
  getProviderHealth,
  resetCircuits,
  AllProvidersFailedError,
} from '../src/lib/circuit-breaker'

vi.mock('../src/lib/model-registry', () => ({
  getAvailableProviders: vi.fn().mockReturnValue(['openai', 'anthropic', 'google']),
}))

describe('circuit-breaker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetCircuits()
  })

  describe('CircuitBreaker', () => {
    it('starts in closed state', () => {
      const circuit = new CircuitBreaker()
      expect(circuit.getState()).toBe('closed')
      expect(circuit.canExecute()).toBe(true)
    })

    it('opens after failureThreshold consecutive failures', () => {
      const circuit = new CircuitBreaker({ failureThreshold: 3 })

      circuit.recordFailure()
      expect(circuit.getState()).toBe('closed')

      circuit.recordFailure()
      expect(circuit.getState()).toBe('closed')

      circuit.recordFailure()
      expect(circuit.getState()).toBe('open')
    })

    it('open circuit prevents execution', () => {
      const circuit = new CircuitBreaker({ failureThreshold: 2 })

      circuit.recordFailure()
      circuit.recordFailure()

      expect(circuit.getState()).toBe('open')
      expect(circuit.canExecute()).toBe(false)
    })

    it('transitions to half-open after recoveryTimeout', async () => {
      const circuit = new CircuitBreaker({
        failureThreshold: 2,
        recoveryTimeoutMs: 50,
      })

      circuit.recordFailure()
      circuit.recordFailure()
      expect(circuit.getState()).toBe('open')
      expect(circuit.canExecute()).toBe(false)

      await new Promise(resolve => setTimeout(resolve, 60))

      expect(circuit.canExecute()).toBe(true)
      expect(circuit.getState()).toBe('half-open')
    })

    it('half-open allows execution', () => {
      const circuit = new CircuitBreaker({ failureThreshold: 1, recoveryTimeoutMs: 0 })

      circuit.recordFailure()
      expect(circuit.getState()).toBe('open')

      // Force transition to half-open
      circuit.canExecute()
      expect(circuit.getState()).toBe('half-open')
      expect(circuit.canExecute()).toBe(true)
    })

    it('transitions half-open to closed after N successes', () => {
      const circuit = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 0,
        halfOpenMaxAttempts: 3,
      })

      circuit.recordFailure()
      circuit.canExecute() // Force to half-open
      expect(circuit.getState()).toBe('half-open')

      circuit.recordSuccess()
      expect(circuit.getState()).toBe('half-open')

      circuit.recordSuccess()
      expect(circuit.getState()).toBe('half-open')

      circuit.recordSuccess()
      expect(circuit.getState()).toBe('closed')
    })

    it('transitions half-open to open on single failure', () => {
      const circuit = new CircuitBreaker({
        failureThreshold: 1,
        recoveryTimeoutMs: 0,
      })

      circuit.recordFailure()
      circuit.canExecute() // Force to half-open
      expect(circuit.getState()).toBe('half-open')

      circuit.recordFailure()
      expect(circuit.getState()).toBe('open')
    })

    it('resets all state when reset() is called', () => {
      const circuit = new CircuitBreaker({ failureThreshold: 2 })

      circuit.recordFailure()
      circuit.recordFailure()
      expect(circuit.getState()).toBe('open')

      circuit.reset()
      expect(circuit.getState()).toBe('closed')
      expect(circuit.canExecute()).toBe(true)
    })

    it('recordSuccess in closed state resets counters', () => {
      const circuit = new CircuitBreaker({ failureThreshold: 3 })

      circuit.recordFailure()
      circuit.recordSuccess()
      circuit.recordFailure()
      circuit.recordFailure()

      // Should still be closed because success reset the counter
      expect(circuit.getState()).toBe('closed')
    })
  })

  describe('getOrCreateCircuit', () => {
    it('creates a new circuit for a provider', () => {
      const circuit = getOrCreateCircuit('openai')
      expect(circuit).toBeInstanceOf(CircuitBreaker)
      expect(circuit.getState()).toBe('closed')
    })

    it('returns the same circuit instance for the same provider', () => {
      const circuit1 = getOrCreateCircuit('openai')
      const circuit2 = getOrCreateCircuit('openai')
      expect(circuit1).toBe(circuit2)
    })

    it('creates separate circuits for different providers', () => {
      const circuit1 = getOrCreateCircuit('openai')
      const circuit2 = getOrCreateCircuit('anthropic')
      expect(circuit1).not.toBe(circuit2)
    })
  })

  describe('callWithFailover', () => {
    it('tries providers in priority order (openai first)', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await callWithFailover(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith('openai')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('skips open-circuit providers', async () => {
      const openaiCircuit = getOrCreateCircuit('openai', { failureThreshold: 2 })
      openaiCircuit.recordFailure()
      openaiCircuit.recordFailure()
      expect(openaiCircuit.getState()).toBe('open')

      const mockFn = vi.fn().mockResolvedValue('success')

      const result = await callWithFailover(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith('anthropic')
      expect(mockFn).not.toHaveBeenCalledWith('openai')
    })

    it('returns result from fallback provider when primary fails', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('OpenAI failed'))
        .mockResolvedValueOnce('anthropic success')

      const result = await callWithFailover(mockFn, {
        retryOptions: { maxRetries: 0 }, // Disable retries for clearer test
      })

      expect(result).toBe('anthropic success')
      expect(mockFn).toHaveBeenCalledWith('openai')
      expect(mockFn).toHaveBeenCalledWith('anthropic')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    it('throws AllProvidersFailedError when all exhausted', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('OpenAI failed'))
        .mockRejectedValueOnce(new Error('Anthropic failed'))
        .mockRejectedValueOnce(new Error('Google failed'))

      await expect(callWithFailover(mockFn, {
        retryOptions: { maxRetries: 0 },
      })).rejects.toThrow(AllProvidersFailedError)
    })

    it('AllProvidersFailedError contains per-provider errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('OpenAI error'))
        .mockRejectedValueOnce(new Error('Anthropic error'))
        .mockRejectedValueOnce(new Error('Google error'))

      try {
        await callWithFailover(mockFn, {
          retryOptions: { maxRetries: 0 },
        })
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(AllProvidersFailedError)
        const failureError = error as AllProvidersFailedError

        expect(failureError.errors).toHaveLength(3)
        expect(failureError.errors[0].provider).toBe('openai')
        expect(failureError.errors[0].error.message).toBe('OpenAI error')
        expect(failureError.errors[1].provider).toBe('anthropic')
        expect(failureError.errors[1].error.message).toBe('Anthropic error')
        expect(failureError.errors[2].provider).toBe('google')
        expect(failureError.errors[2].error.message).toBe('Google error')
      }
    })

    it('records success on successful call', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      await callWithFailover(mockFn)

      const circuit = getOrCreateCircuit('openai')
      expect(circuit.getState()).toBe('closed')
    })

    it('records failure and opens circuit after threshold', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Failed'))

      const failureThreshold = 2

      // First failure
      await expect(callWithFailover(mockFn, {
        retryOptions: { maxRetries: 0 },
        circuitOptions: { failureThreshold },
      })).rejects.toThrow(AllProvidersFailedError)

      const openaiCircuit = getOrCreateCircuit('openai')
      expect(openaiCircuit.getState()).toBe('closed')

      // Second failure - should open all circuits
      await expect(callWithFailover(mockFn, {
        retryOptions: { maxRetries: 0 },
        circuitOptions: { failureThreshold },
      })).rejects.toThrow(AllProvidersFailedError)

      expect(openaiCircuit.getState()).toBe('open')
    })

    it('tries all providers as last resort when all circuits open', async () => {
      // Open all circuits
      const openaiCircuit = getOrCreateCircuit('openai', { failureThreshold: 1 })
      const anthropicCircuit = getOrCreateCircuit('anthropic', { failureThreshold: 1 })
      const googleCircuit = getOrCreateCircuit('google', { failureThreshold: 1 })

      openaiCircuit.recordFailure()
      anthropicCircuit.recordFailure()
      googleCircuit.recordFailure()

      expect(openaiCircuit.getState()).toBe('open')
      expect(anthropicCircuit.getState()).toBe('open')
      expect(googleCircuit.getState()).toBe('open')

      // Mock function that succeeds on Google
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('OpenAI failed'))
        .mockRejectedValueOnce(new Error('Anthropic failed'))
        .mockResolvedValueOnce('google success')

      const result = await callWithFailover(mockFn, {
        retryOptions: { maxRetries: 0 },
      })

      expect(result).toBe('google success')
      expect(mockFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('getProviderHealth', () => {
    it('returns current states of all circuits', () => {
      const openaiCircuit = getOrCreateCircuit('openai', { failureThreshold: 1 })
      const anthropicCircuit = getOrCreateCircuit('anthropic', { failureThreshold: 1 })

      openaiCircuit.recordFailure()
      expect(openaiCircuit.getState()).toBe('open')

      const health = getProviderHealth()

      expect(health.openai).toBe('open')
      expect(health.anthropic).toBe('closed')
    })

    it('returns empty object when no circuits created', () => {
      resetCircuits()
      const health = getProviderHealth()
      expect(health).toEqual({})
    })
  })

  describe('resetCircuits', () => {
    it('clears all circuit state', () => {
      getOrCreateCircuit('openai')
      getOrCreateCircuit('anthropic')

      expect(Object.keys(getProviderHealth())).toHaveLength(2)

      resetCircuits()

      expect(Object.keys(getProviderHealth())).toHaveLength(0)
    })
  })
})
