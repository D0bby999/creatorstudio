import { describe, it, expect } from 'vitest'
import { getCacheHeaders, withCacheHeaders } from '../cache-headers'

describe('getCacheHeaders', () => {
  it('returns immutable cache for static assets', () => {
    const headers = getCacheHeaders('immutable')
    expect(headers).toEqual({ 'Cache-Control': 'public, max-age=31536000, immutable' })
  })

  it('returns no-store for authenticated routes', () => {
    const headers = getCacheHeaders('no-cache')
    expect(headers).toEqual({ 'Cache-Control': 'private, no-store, must-revalidate' })
  })

  it('returns 60s cache for short-cache', () => {
    const headers = getCacheHeaders('short-cache')
    expect(headers).toEqual({ 'Cache-Control': 'public, max-age=60, must-revalidate' })
  })

  it('returns 5m cache for medium-cache', () => {
    const headers = getCacheHeaders('medium-cache')
    expect(headers).toEqual({ 'Cache-Control': 'public, max-age=300, must-revalidate' })
  })
})

describe('withCacheHeaders', () => {
  it('merges cache headers with existing headers', () => {
    const result = withCacheHeaders('no-cache', { 'Content-Type': 'application/json' })
    expect(result.get('Content-Type')).toBe('application/json')
    expect(result.get('Cache-Control')).toBe('private, no-store, must-revalidate')
  })

  it('works without existing headers', () => {
    const result = withCacheHeaders('short-cache')
    expect(result.get('Cache-Control')).toBe('public, max-age=60, must-revalidate')
  })
})
