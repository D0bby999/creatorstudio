import type { CrawlerEngineConfig } from '../types/crawler-types.js'

/**
 * Default configuration for crawler engine
 */
export const DEFAULT_CRAWLER_CONFIG: CrawlerEngineConfig = {
  maxConcurrency: 10,
  minConcurrency: 1,
  requestTimeoutMs: 30000,
  maxDepth: 5,
  sameDomainOnly: true,
  rateLimitPerDomain: 60,
  queueStrategy: 'bfs',
  renderingTypeDetectionRatio: 0.1,
}

/**
 * Merge partial config with defaults
 * @param partial - Partial configuration overrides
 * @returns Complete configuration with defaults
 */
export function mergeConfig(partial: Partial<CrawlerEngineConfig> = {}): CrawlerEngineConfig {
  return {
    ...DEFAULT_CRAWLER_CONFIG,
    ...partial,
  }
}
