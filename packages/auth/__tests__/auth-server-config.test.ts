import { describe, it, expect } from 'vitest'

// Mock auth-server
import { auth } from '../src/auth-server'

describe('auth server configuration', () => {
  it('exports auth object', () => {
    expect(auth).toBeDefined()
    expect(auth).toBeTruthy()
  })

  it('has api.getSession function', () => {
    expect(typeof auth.api.getSession).toBe('function')
  })

  it('has handler function for request handling', () => {
    expect(typeof auth.handler).toBe('function')
  })

  it('has api object with auth methods', () => {
    expect(auth.api).toBeDefined()
    expect(typeof auth.api.getSession).toBe('function')
    expect(typeof auth.api.signUpEmail).toBe('function')
  })
})
