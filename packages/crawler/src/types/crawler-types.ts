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

export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'xml'

// Enhanced crawler engine types
export interface CrawlRequest {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  userData?: Record<string, unknown>
  uniqueKey: string  // default: normalized URL
  retryCount: number
  maxRetries: number
  noRetry?: boolean
  label?: string
  depth?: number
}

export interface CrawlResult {
  url: string
  statusCode: number
  body: string
  headers: Record<string, string>
  contentType: string
  scrapedContent?: ScrapedContent
  request: CrawlRequest
}

export interface CrawlerEngineConfig {
  maxConcurrency: number
  minConcurrency: number
  maxRequestsPerCrawl?: number
  requestTimeoutMs: number
  maxDepth: number
  sameDomainOnly: boolean
  rateLimitPerDomain: number
  queueStrategy: 'bfs' | 'dfs'
  renderingTypeDetectionRatio: number  // 0.0-1.0, default 0.1
  stealth?: boolean
}

export interface QueueStats {
  pending: number
  completed: number
  failed: number
  total: number
}

export interface QueueOperationInfo {
  wasAlreadyPresent: boolean
  uniqueKey: string
}

export interface BatchOpts {
  batchSize?: number
  waitBetweenBatchesMillis?: number
}

export interface CrawlRunResult {
  stats: QueueStats
  duration: number
  errors: Array<{ url: string; error: string }>
}

export type CrawlerEvent =
  | 'requestStarted'
  | 'requestCompleted'
  | 'requestFailed'
  | 'crawlFinished'

// Advanced data extraction types
export interface JsonLdData {
  '@type'?: string
  '@context'?: string
  [key: string]: unknown
}

export interface OpenGraphData {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  [key: string]: string | undefined
}

export interface SchemaOrgData {
  type: string
  properties: Record<string, string | SchemaOrgData>
}

export interface TableData {
  headers: string[]
  rows: string[][]
}

export interface CssSelectorConfig {
  name: string
  selector: string
  attribute?: string  // default: textContent
  multiple?: boolean
}

export interface XPathConfig {
  name: string
  expression: string
  multiple?: boolean
}

export interface ExtractionConfig {
  jsonLd?: boolean
  openGraph?: boolean
  schemaOrg?: boolean
  tables?: boolean
  cssSelectors?: CssSelectorConfig[]
  xpathExpressions?: XPathConfig[]
}

export interface SocialHandlesData {
  instagram: string[]
  twitter: string[]
  facebook: string[]
  youtube: string[]
  tiktok: string[]
  linkedin: string[]
  pinterest: string[]
  discord: string[]
  emails: { certain: string[]; uncertain: string[] }
  phones: { certain: string[]; uncertain: string[] }
}

export interface ExtractedData {
  jsonLd?: JsonLdData[]
  openGraph?: OpenGraphData
  schemaOrg?: SchemaOrgData[]
  tables?: TableData[]
  cssSelectors?: Record<string, string | string[]>
  xpath?: Record<string, string | string[]>
  social?: SocialHandlesData
}

// Stealth & Anti-Bot types
export interface CaptchaDetection {
  detected: boolean
  type?: 'recaptcha' | 'hcaptcha' | 'turnstile' | 'unknown'
  confidence: number  // 0-1
}

export interface CloudflareDetection {
  detected: boolean
  type?: 'challenge' | 'block' | 'none'
  cfRay?: string
}

export interface CrawlSession {
  id: string
  cookies: Record<string, string>
  userAgent: string
  proxy?: string
  errorScore: number
  usageCount: number
  createdAt: number
  isUsable: boolean
  fingerprintId?: string
}

export interface SessionPoolConfig {
  maxSessions?: number          // default 10
  maxErrorScore?: number        // default 3
  maxUsageCount?: number        // default 50
  sessionRotationEnabled?: boolean  // default true
}

// URL Discovery & Sitemap types
export interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export interface RobotsTxtRules {
  rules: Array<{
    userAgent: string
    allow: string[]
    disallow: string[]
    crawlDelay?: number
  }>
  sitemaps: string[]
}

export interface DiscoveredLink {
  url: string
  text: string
  rel?: string
  tag: string  // 'a' | 'link' | 'area'
}

export interface UrlFilterConfig {
  include?: string[]
  exclude?: string[]
  skipAssets?: boolean
}

// Job management types
export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low'

export interface JobProgress {
  pagesCrawled: number
  pagesTotal: number
  currentUrl: string
  elapsedMs: number
  estimatedRemainingMs: number
  bytesDownloaded: number
}

export interface EnhancedCrawlJob {
  id: string
  url: string
  type: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  config?: Partial<CrawlerEngineConfig>
  result?: unknown
  error?: string
  priority: PriorityLevel
  retryCount: number
  maxRetries: number
  progress?: JobProgress
  templateId?: string
  scheduleId?: string
  userId: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ResourceLimits {
  maxPages?: number
  maxDurationMs?: number
  maxBytes?: number
}

export interface CrawlTemplate {
  id: string
  name: string
  description?: string
  config: Partial<CrawlerEngineConfig>
  isPublic: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CrawlSchedule {
  id: string
  name: string
  cron: string
  templateId: string
  isActive: boolean
  lastRunAt?: string
  nextRunAt?: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Export & Dataset types
export interface DatasetItem {
  id: string
  datasetId: string
  url: string
  data: ScrapedContent
  contentHash: string
  createdAt: string
}

export interface CrawlDataset {
  id: string
  name: string
  description?: string
  jobId?: string
  itemCount: number
  totalBytes: number
  userId: string
  items: DatasetItem[]
  createdAt: string
  updatedAt: string
}

export interface CsvColumn {
  key: string
  header: string
}

export interface DatasetDiff {
  added: string[]
  removed: string[]
  changed: Array<{ url: string; oldHash: string; newHash: string }>
}

export interface IncrementalResult {
  modified: boolean
  hash: string
  statusCode: number
}
