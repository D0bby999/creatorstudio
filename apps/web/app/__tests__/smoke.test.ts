import { describe, it, expect } from 'vitest'

describe('smoke tests', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have correct environment', () => {
    expect(typeof process).toBe('object')
  })
})
