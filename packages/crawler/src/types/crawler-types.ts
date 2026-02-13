export interface ScrapedContent {
  url: string
  title: string
  description: string
  headings: string[]
  images: string[]
  links: string[]
  text: string
  meta: Record<string, string>
  scrapedAt: string
}

export interface SeoReport {
  url: string
  score: number // 0-100
  title: { value: string; length: number; optimal: boolean }
  description: { value: string; length: number; optimal: boolean }
  headings: { h1Count: number; h2Count: number; h3Count: number; hasH1: boolean }
  images: { total: number; withAlt: number; missingAlt: number }
  keywords: { word: string; count: number }[]
  issues: string[]
  analyzedAt: string
}

export interface CrawlJob {
  id: string
  url: string
  type: 'url' | 'seo'
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: ScrapedContent | SeoReport
  error?: string
  createdAt: string
  completedAt?: string
}

export interface TrackedUrl {
  id: string
  url: string
  label: string
  lastCrawl?: string
  schedule?: string
}

export interface RequestQueueItem {
  url: string
  priority: number
  retryCount: number
  maxRetries: number
  metadata?: Record<string, unknown>
}

export interface RateLimitConfig {
  maxPerMinute: number
  maxConcurrent: number
}

export interface CrawlConfig {
  maxDepth: number
  sameDomainOnly: boolean
  maxPages: number
  rateLimitPerDomain: number
}

export type ExportFormat = 'json' | 'csv'
