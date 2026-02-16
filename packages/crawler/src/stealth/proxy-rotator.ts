/**
 * Proxy rotation with LRU selection per hostname
 * Parses PROXY_URLS env var and rotates proxies intelligently
 */

interface ProxyUsage {
  url: string
  lastUsed: number
  blocked: boolean
}

export class ProxyRotator {
  private proxies: ProxyUsage[] = []
  private hostnameLRU = new Map<string, string>() // hostname -> last proxy used

  constructor() {
    this.loadProxies()
  }

  /**
   * Load proxies from PROXY_URLS env var
   * Format: comma-separated proxy URLs (http://user:pass@host:port or socks5://host:port)
   */
  private loadProxies(): void {
    const proxyUrls = process.env.PROXY_URLS

    if (!proxyUrls) {
      return
    }

    const urls = proxyUrls.split(',').map((url) => url.trim()).filter(Boolean)

    this.proxies = urls.map((url) => ({
      url,
      lastUsed: 0,
      blocked: false,
    }))
  }

  /**
   * Get least-recently-used proxy for hostname
   * Returns null if no proxies available or all blocked
   */
  getProxy(hostname: string): string | null {
    if (this.proxies.length === 0) {
      return null
    }

    // Filter out blocked proxies
    const availableProxies = this.proxies.filter((p) => !p.blocked)

    if (availableProxies.length === 0) {
      return null
    }

    // Get last proxy used for this hostname
    const lastProxy = this.hostnameLRU.get(hostname)

    // Find LRU proxy (excluding last used for this hostname)
    let selectedProxy = availableProxies[0]

    for (const proxy of availableProxies) {
      // Skip if this was the last proxy used for this hostname
      if (lastProxy && proxy.url === lastProxy) {
        continue
      }

      // Select proxy with oldest lastUsed timestamp
      if (proxy.lastUsed < selectedProxy.lastUsed) {
        selectedProxy = proxy
      }
    }

    // Update usage
    selectedProxy.lastUsed = Date.now()
    this.hostnameLRU.set(hostname, selectedProxy.url)

    return selectedProxy.url
  }

  /**
   * Mark proxy as blocked, rotate away from it
   */
  markBlocked(proxyUrl: string): void {
    const proxy = this.proxies.find((p) => p.url === proxyUrl)

    if (proxy) {
      proxy.blocked = true
    }
  }

  /**
   * Reset all proxies (unblock)
   */
  resetAll(): void {
    for (const proxy of this.proxies) {
      proxy.blocked = false
      proxy.lastUsed = 0
    }
    this.hostnameLRU.clear()
  }
}
