/**
 * Strategy-based link enqueueing (Crawlee pattern)
 * 4 strategies: All, SameHostname, SameDomain, SameOrigin
 * Supports glob + regex patterns, exclude filters, robots.txt check
 */

import { minimatch } from 'minimatch'
import type { RobotsTxtRules } from '../types/crawler-types.js'
import { isAllowed } from '../discovery/robots-txt-parser.js'

export enum EnqueueStrategy {
  All = 'all',
  SameHostname = 'same-hostname',
  SameDomain = 'same-domain',
  SameOrigin = 'same-origin',
}

export interface GlobInput {
  glob: string
  userData?: Record<string, unknown>
  label?: string
}

export interface RegexpInput {
  regexp: RegExp
  userData?: Record<string, unknown>
  label?: string
}

type PatternInput = string | RegExp | GlobInput | RegexpInput

export interface EnqueueLinksOptions {
  urls: string[]
  baseUrl: string
  strategy?: EnqueueStrategy
  globs?: PatternInput[]
  regexps?: PatternInput[]
  exclude?: PatternInput[]
  transformRequestFunction?: (req: EnqueuedRequest) => EnqueuedRequest | null
  limit?: number
  robotsTxt?: RobotsTxtRules
  onSkippedRequest?: (details: { url: string; reason: string }) => void
}

export interface EnqueuedRequest {
  url: string
  depth: number
  userData?: Record<string, unknown>
  label?: string
}

export interface EnqueueLinksResult {
  processedRequests: EnqueuedRequest[]
  skippedCount: number
}

export function enqueueLinks(options: EnqueueLinksOptions): EnqueueLinksResult {
  const {
    urls,
    baseUrl,
    strategy = EnqueueStrategy.SameHostname,
    globs = [],
    regexps = [],
    exclude = [],
    transformRequestFunction,
    limit = 1000,
    robotsTxt,
    onSkippedRequest,
  } = options

  let baseUrlObj: URL
  try {
    baseUrlObj = new URL(baseUrl)
  } catch {
    return { processedRequests: [], skippedCount: urls.length }
  }

  const processed: EnqueuedRequest[] = []
  let skippedCount = 0

  for (const rawUrl of urls.slice(0, limit)) {
    let urlObj: URL
    try {
      urlObj = new URL(rawUrl, baseUrl)
    } catch {
      skippedCount++
      onSkippedRequest?.({ url: rawUrl, reason: 'invalid' })
      continue
    }

    const fullUrl = urlObj.href

    // Strategy filter
    if (!matchesStrategy(urlObj, baseUrlObj, strategy)) {
      skippedCount++
      onSkippedRequest?.({ url: fullUrl, reason: 'strategy' })
      continue
    }

    // Exclude patterns
    if (exclude.length > 0 && matchesAnyPattern(fullUrl, exclude)) {
      skippedCount++
      onSkippedRequest?.({ url: fullUrl, reason: 'exclude' })
      continue
    }

    // Include patterns (globs + regexps)
    const includePatterns = [...globs, ...regexps]
    if (includePatterns.length > 0 && !matchesAnyPattern(fullUrl, includePatterns)) {
      skippedCount++
      onSkippedRequest?.({ url: fullUrl, reason: 'filters' })
      continue
    }

    // Robots.txt check
    if (robotsTxt && !isAllowed(fullUrl, robotsTxt)) {
      skippedCount++
      onSkippedRequest?.({ url: fullUrl, reason: 'robotsTxt' })
      continue
    }

    // Build request
    let request: EnqueuedRequest = { url: fullUrl, depth: 0 }

    // Extract userData/label from matching pattern
    const matchedPattern = findMatchingPattern(fullUrl, includePatterns)
    if (matchedPattern && typeof matchedPattern === 'object' && 'userData' in matchedPattern) {
      request.userData = (matchedPattern as GlobInput).userData
      request.label = (matchedPattern as GlobInput).label
    }

    // Apply transform
    if (transformRequestFunction) {
      const transformed = transformRequestFunction(request)
      if (!transformed) {
        skippedCount++
        onSkippedRequest?.({ url: fullUrl, reason: 'transform' })
        continue
      }
      request = transformed
    }

    processed.push(request)
  }

  return { processedRequests: processed, skippedCount }
}

function matchesStrategy(url: URL, base: URL, strategy: EnqueueStrategy): boolean {
  switch (strategy) {
    case EnqueueStrategy.All:
      return true
    case EnqueueStrategy.SameOrigin:
      return url.origin === base.origin
    case EnqueueStrategy.SameHostname:
      return url.hostname === base.hostname
    case EnqueueStrategy.SameDomain:
      return getDomain(url.hostname) === getDomain(base.hostname)
  }
}

function getDomain(hostname: string): string {
  const parts = hostname.split('.')
  return parts.length >= 2 ? parts.slice(-2).join('.') : hostname
}

function matchesAnyPattern(url: string, patterns: PatternInput[]): boolean {
  return patterns.some((pattern) => matchesPattern(url, pattern))
}

function matchesPattern(url: string, pattern: PatternInput): boolean {
  if (typeof pattern === 'string') {
    return minimatch(url, pattern, { nocase: true })
  }
  if (pattern instanceof RegExp) {
    return pattern.test(url)
  }
  if ('glob' in pattern) {
    return minimatch(url, pattern.glob, { nocase: true })
  }
  if ('regexp' in pattern) {
    return pattern.regexp.test(url)
  }
  return false
}

function findMatchingPattern(
  url: string,
  patterns: PatternInput[]
): PatternInput | undefined {
  return patterns.find((p) => matchesPattern(url, p))
}
