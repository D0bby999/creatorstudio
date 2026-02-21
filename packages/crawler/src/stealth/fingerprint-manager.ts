/**
 * Per-session browser fingerprint generation and injection
 * Uses fingerprint-generator for device-unique signatures
 * and fingerprint-injector for battle-tested CDP injection
 */

import { FingerprintGenerator } from 'fingerprint-generator'
import { newInjectedPage } from 'fingerprint-injector'
import { randomUUID } from 'node:crypto'

export interface FingerprintOptions {
  devices?: ('desktop' | 'mobile')[]
  browsers?: Array<{ name: 'chrome' | 'firefox' | 'safari' | 'edge'; minVersion?: number; maxVersion?: number }>
  locales?: string[]
  operatingSystems?: ('windows' | 'linux' | 'macos')[]
}

export interface GeneratedFingerprint {
  id: string
  fingerprint: ReturnType<FingerprintGenerator['getFingerprint']>
  headers: Record<string, string>
  userAgent: string
  screen: { width: number; height: number }
}

const DEFAULT_OPTIONS: FingerprintOptions = {
  devices: ['desktop'],
  browsers: [{ name: 'chrome' }, { name: 'firefox' }],
  locales: ['en-US'],
  operatingSystems: ['windows', 'linux'],
}

const MAX_CACHE_SIZE = 1000

export class FingerprintManager {
  private generator: FingerprintGenerator
  private cache = new Map<string, GeneratedFingerprint>()

  constructor(options?: FingerprintOptions) {
    const opts = { ...DEFAULT_OPTIONS, ...options }
    this.generator = new FingerprintGenerator({
      devices: opts.devices,
      browsers: opts.browsers as any,
      locales: opts.locales,
      operatingSystems: opts.operatingSystems,
    })
  }

  generate(): GeneratedFingerprint {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }

    const fingerprint = this.generator.getFingerprint()
    const id = randomUUID()
    const headers = this.extractHeaders(fingerprint)
    const nav = fingerprint.fingerprint.navigator
    const screen = fingerprint.fingerprint.screen

    const generated: GeneratedFingerprint = {
      id,
      fingerprint,
      headers,
      userAgent: nav.userAgent,
      screen: { width: screen.width, height: screen.height },
    }

    this.cache.set(id, generated)
    return generated
  }

  get(id: string): GeneratedFingerprint | undefined {
    return this.cache.get(id)
  }

  invalidate(id: string): void {
    this.cache.delete(id)
  }

  /**
   * Apply fingerprint to a Puppeteer page via CDP injection
   * Handles canvas, WebGL, navigator, plugins, fonts
   */
  async applyToPage(page: any, fingerprintId: string): Promise<void> {
    const fp = this.cache.get(fingerprintId)
    if (!fp) {
      throw new Error(`Fingerprint ${fingerprintId} not found in cache`)
    }

    try {
      await newInjectedPage(page.browser(), {
        fingerprint: fp.fingerprint,
      })
    } catch {
      // Fallback: set User-Agent via CDP if injector fails
      const client = await page.createCDPSession()
      await client.send('Network.setUserAgentOverride', {
        userAgent: fp.userAgent,
      })
    }
  }

  private extractHeaders(
    fp: ReturnType<FingerprintGenerator['getFingerprint']>
  ): Record<string, string> {
    const nav = fp.fingerprint.navigator
    return {
      'User-Agent': nav.userAgent,
      'Accept-Language': nav.language ?? 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    }
  }

  getCacheSize(): number {
    return this.cache.size
  }
}
