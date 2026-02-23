// Lightweight performance monitoring for canvas operations
// Pure functions using browser Performance API, in-memory storage only

interface MetricStats {
  count: number
  avg: number
  max: number
  min: number
  total: number
}

// Global metrics storage
const metrics = new Map<string, number[]>()

/**
 * Start a performance measurement
 * @param label - Measurement label
 * @returns Stop function that returns elapsed milliseconds
 */
export function startMeasure(label: string): () => number {
  const startTime = performance.now()

  return (): number => {
    const elapsed = performance.now() - startTime
    trackMetric(label, elapsed)
    return elapsed
  }
}

/**
 * Track a metric value
 * @param name - Metric name
 * @param value - Metric value
 */
export function trackMetric(name: string, value: number): void {
  if (!metrics.has(name)) {
    metrics.set(name, [])
  }
  metrics.get(name)!.push(value)
}

/**
 * Get aggregated metrics
 * @returns Record of metric name to statistics
 */
export function getMetrics(): Record<string, MetricStats> {
  const result: Record<string, MetricStats> = {}

  for (const [name, values] of metrics.entries()) {
    if (values.length === 0) continue

    const total = values.reduce((sum, val) => sum + val, 0)
    const avg = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)

    result[name] = {
      count: values.length,
      avg: Math.round(avg * 100) / 100,
      max: Math.round(max * 100) / 100,
      min: Math.round(min * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }

  return result
}

/**
 * Reset all metrics
 */
export function resetMetrics(): void {
  metrics.clear()
}

/**
 * Format metrics as a readable summary string
 * @returns Formatted metrics string
 */
export function reportMetrics(): string {
  const metricsData = getMetrics()
  const entries = Object.entries(metricsData)

  if (entries.length === 0) {
    return 'No metrics recorded'
  }

  const lines = ['Canvas Performance Metrics:', '']

  for (const [name, stats] of entries) {
    lines.push(`${name}:`)
    lines.push(`  Count: ${stats.count}`)
    lines.push(`  Avg:   ${stats.avg}ms`)
    lines.push(`  Min:   ${stats.min}ms`)
    lines.push(`  Max:   ${stats.max}ms`)
    lines.push(`  Total: ${stats.total}ms`)
    lines.push('')
  }

  return lines.join('\n')
}
