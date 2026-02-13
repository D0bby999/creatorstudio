/**
 * Manages sessions (cookies, user agents) per domain for web scraping
 */
export class SessionManager {
  private static readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ]

  private sessions = new Map<string, { cookies: string; uaIndex: number }>()

  /**
   * Get or create session for domain
   * @returns Session with cookies and user agent
   */
  getSession(domain: string): { cookies: string; userAgent: string } {
    let session = this.sessions.get(domain)

    if (!session) {
      session = { cookies: '', uaIndex: 0 }
      this.sessions.set(domain, session)
    }

    return {
      cookies: session.cookies,
      userAgent: SessionManager.USER_AGENTS[session.uaIndex],
    }
  }

  /**
   * Store cookie for domain
   */
  setCookie(domain: string, cookie: string): void {
    const session = this.sessions.get(domain) || { cookies: '', uaIndex: 0 }
    session.cookies = cookie
    this.sessions.set(domain, session)
  }

  /**
   * Rotate to next user agent for domain
   * @returns New user agent string
   */
  rotateUserAgent(domain: string): string {
    const session = this.sessions.get(domain) || { cookies: '', uaIndex: 0 }
    session.uaIndex = (session.uaIndex + 1) % SessionManager.USER_AGENTS.length
    this.sessions.set(domain, session)
    return SessionManager.USER_AGENTS[session.uaIndex]
  }

  /**
   * Clear session data for domain
   */
  clearSession(domain: string): void {
    this.sessions.delete(domain)
  }
}
