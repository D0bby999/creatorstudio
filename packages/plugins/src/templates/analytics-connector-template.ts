/**
 * Analytics Connector Plugin Template
 *
 * Use this template to create plugins that integrate with analytics platforms.
 * Implement the AnalyticsConnectorPlugin interface to add custom analytics support.
 */

export interface AnalyticsEvent {
  eventName: string
  timestamp: Date
  userId?: string
  sessionId?: string
  properties?: Record<string, unknown>
}

export interface AnalyticsQuery {
  startDate: Date
  endDate: Date
  metrics: string[]
  dimensions?: string[]
  filters?: Record<string, unknown>
}

export interface AnalyticsMetric {
  name: string
  value: number
  unit?: string
  trend?: number
}

export interface AnalyticsAuthConfig {
  apiKey?: string
  accessToken?: string
  projectId?: string
  customConfig?: Record<string, unknown>
}

export interface AnalyticsConnectorPlugin {
  /** Analytics platform identifier (e.g., 'google-analytics', 'mixpanel') */
  platformId: string

  /** Display name of the analytics platform */
  platformName: string

  /** Initialize connection with authentication */
  connect(config: AnalyticsAuthConfig): Promise<void>

  /** Track a single event */
  trackEvent(event: AnalyticsEvent): Promise<void>

  /** Track multiple events in batch */
  trackEvents(events: AnalyticsEvent[]): Promise<void>

  /** Query analytics data */
  query(query: AnalyticsQuery): Promise<{
    metrics: AnalyticsMetric[]
    data: Record<string, unknown>[]
  }>

  /** Get available metrics for this platform */
  getAvailableMetrics(): Promise<Array<{ id: string; name: string; description: string }>>

  /** Validate connection and credentials */
  validateConnection(): Promise<boolean>

  /** Disconnect and clean up resources */
  disconnect(): Promise<void>
}

/**
 * Example implementation:
 *
 * export class GoogleAnalyticsPlugin implements AnalyticsConnectorPlugin {
 *   platformId = 'google-analytics'
 *   platformName = 'Google Analytics 4'
 *   private client: any
 *
 *   async connect(config: AnalyticsAuthConfig) {
 *     this.client = initializeGA4Client({
 *       apiKey: config.apiKey,
 *       propertyId: config.projectId,
 *     })
 *   }
 *
 *   async trackEvent(event: AnalyticsEvent) {
 *     await this.client.events.create({
 *       name: event.eventName,
 *       params: event.properties,
 *     })
 *   }
 *
 *   async query(query: AnalyticsQuery) {
 *     const response = await this.client.reports.runReport({
 *       dateRanges: [{ startDate: query.startDate, endDate: query.endDate }],
 *       metrics: query.metrics.map(m => ({ name: m })),
 *       dimensions: query.dimensions?.map(d => ({ name: d })),
 *     })
 *     return {
 *       metrics: response.metrics.map(m => ({
 *         name: m.name,
 *         value: m.value,
 *       })),
 *       data: response.rows,
 *     }
 *   }
 *
 *   // ... implement other methods
 * }
 */
