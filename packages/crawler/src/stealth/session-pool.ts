/**
 * Session pool with error-score lifecycle (Crawlee pattern)
 * Auto-retire sessions based on error score and usage count
 */

import { randomUUID } from 'node:crypto'
import type { CrawlSession, SessionPoolConfig } from '../types/crawler-types.js'
import { UserAgentPool } from './user-agent-pool.js'
import { ProxyRotator } from './proxy-rotator.js'

export class SessionPool {
  private sessions = new Map<string, CrawlSession>()
  private userAgentPool = new UserAgentPool()
  private proxyRotator = new ProxyRotator()
  private config: Required<SessionPoolConfig>

  constructor(config?: SessionPoolConfig) {
    this.config = {
      maxSessions: config?.maxSessions ?? 10,
      maxErrorScore: config?.maxErrorScore ?? 3,
      maxUsageCount: config?.maxUsageCount ?? 50,
      sessionRotationEnabled: config?.sessionRotationEnabled ?? true,
    }
  }

  /**
   * Get or create usable session
   */
  getSession(hostname?: string): CrawlSession {
    // Try to find usable session
    const usableSession = this.findUsableSession()

    if (usableSession) {
      usableSession.usageCount++
      return usableSession
    }

    // Create new session if pool not full
    if (this.sessions.size < this.config.maxSessions) {
      return this.createSession(hostname)
    }

    // Pool full, retire worst session and create new one
    this.retireWorstSession()
    return this.createSession(hostname)
  }

  /**
   * Mark session as good (decrement error score)
   */
  markGood(sessionId: string): void {
    const session = this.sessions.get(sessionId)

    if (session) {
      session.errorScore = Math.max(0, session.errorScore - 1)
      this.updateUsability(session)
    }
  }

  /**
   * Mark session as bad (increment error score)
   */
  markBad(sessionId: string): void {
    const session = this.sessions.get(sessionId)

    if (session) {
      session.errorScore++
      this.updateUsability(session)

      // Auto-retire if error score exceeds threshold
      if (session.errorScore >= this.config.maxErrorScore) {
        this.sessions.delete(sessionId)
      }
    }
  }

  /**
   * Create new session
   */
  private createSession(hostname?: string): CrawlSession {
    const id = randomUUID()
    const userAgent = hostname
      ? this.userAgentPool.getAgentForDomain(hostname)
      : this.userAgentPool.getAgent()
    const proxy = hostname ? this.proxyRotator.getProxy(hostname) : null

    const session: CrawlSession = {
      id,
      cookies: {},
      userAgent,
      proxy: proxy ?? undefined,
      errorScore: 0,
      usageCount: 0,
      createdAt: Date.now(),
      isUsable: true,
    }

    this.sessions.set(id, session)
    return session
  }

  /**
   * Find usable session
   */
  private findUsableSession(): CrawlSession | null {
    const sessions = Array.from(this.sessions.values())
    for (const session of sessions) {
      if (session.isUsable) {
        return session
      }
    }
    return null
  }

  /**
   * Retire worst session (highest error score or usage count)
   */
  private retireWorstSession(): void {
    let worstSession: CrawlSession | null = null
    let worstScore = -1

    const sessions = Array.from(this.sessions.values())
    for (const session of sessions) {
      const score = session.errorScore * 100 + session.usageCount
      if (score > worstScore) {
        worstScore = score
        worstSession = session
      }
    }

    if (worstSession) {
      this.sessions.delete(worstSession.id)
    }
  }

  /**
   * Update session usability based on error score and usage count
   */
  private updateUsability(session: CrawlSession): void {
    session.isUsable =
      session.errorScore < this.config.maxErrorScore &&
      session.usageCount < this.config.maxUsageCount
  }

  /**
   * Get pool stats
   */
  getStats() {
    return {
      total: this.sessions.size,
      usable: Array.from(this.sessions.values()).filter((s) => s.isUsable).length,
    }
  }
}
