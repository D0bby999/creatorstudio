import { describe, it, expect, beforeEach } from 'vitest'
import { SessionManager } from '../src/lib/session-manager'

describe('SessionManager', () => {
  let manager: SessionManager

  beforeEach(() => {
    manager = new SessionManager()
  })

  it('should return consistent user agent for same domain', () => {
    const session1 = manager.getSession('example.com')
    const session2 = manager.getSession('example.com')

    expect(session1.userAgent).toBe(session2.userAgent)
    expect(session1.userAgent).toBeTruthy()
    expect(session1.userAgent).toContain('Mozilla')
  })

  it('should return empty cookies for new domain', () => {
    const session = manager.getSession('example.com')
    expect(session.cookies).toBe('')
  })

  it('should store and return cookies for domain', () => {
    manager.setCookie('example.com', 'session=abc123; path=/')

    const session = manager.getSession('example.com')
    expect(session.cookies).toBe('session=abc123; path=/')
  })

  it('should rotate user agent to next in list', () => {
    const session1 = manager.getSession('example.com')
    const ua1 = session1.userAgent

    const ua2 = manager.rotateUserAgent('example.com')
    expect(ua2).not.toBe(ua1)
    expect(ua2).toBeTruthy()

    const session2 = manager.getSession('example.com')
    expect(session2.userAgent).toBe(ua2)
  })

  it('should cycle through all user agents', () => {
    const userAgents = new Set<string>()

    // Rotate 10 times to cycle through all 5 UAs twice
    for (let i = 0; i < 10; i++) {
      const session = manager.getSession('example.com')
      userAgents.add(session.userAgent)
      manager.rotateUserAgent('example.com')
    }

    // Should have seen exactly 5 unique UAs
    expect(userAgents.size).toBe(5)
  })

  it('should preserve cookies when rotating user agent', () => {
    manager.setCookie('example.com', 'auth=token123')
    manager.rotateUserAgent('example.com')

    const session = manager.getSession('example.com')
    expect(session.cookies).toBe('auth=token123')
  })

  it('should clear session data for domain', () => {
    manager.setCookie('example.com', 'data=test')
    manager.clearSession('example.com')

    const session = manager.getSession('example.com')
    expect(session.cookies).toBe('')
  })

  it('should track sessions independently per domain', () => {
    manager.setCookie('example.com', 'cookie1=value1')
    manager.setCookie('other.com', 'cookie2=value2')

    const session1 = manager.getSession('example.com')
    const session2 = manager.getSession('other.com')

    expect(session1.cookies).toBe('cookie1=value1')
    expect(session2.cookies).toBe('cookie2=value2')
  })
})
