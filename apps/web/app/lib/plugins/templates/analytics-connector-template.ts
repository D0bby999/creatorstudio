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
  platformId: string
  platformName: string
  connect(config: AnalyticsAuthConfig): Promise<void>
  trackEvent(event: AnalyticsEvent): Promise<void>
  trackEvents(events: AnalyticsEvent[]): Promise<void>
  query(query: AnalyticsQuery): Promise<{
    metrics: AnalyticsMetric[]
    data: Record<string, unknown>[]
  }>
  getAvailableMetrics(): Promise<Array<{ id: string; name: string; description: string }>>
  validateConnection(): Promise<boolean>
  disconnect(): Promise<void>
}
