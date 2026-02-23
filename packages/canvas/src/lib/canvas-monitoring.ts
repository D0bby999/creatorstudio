// Lightweight performance monitoring for canvas operations
// Pure functions using browser Performance API, in-memory storage only

interface MetricStats {
  count: number
  avg: number
  max: number
  min: number
  total: number
}

interface RunningStats {
  count: number
  sum: number
  min: number
  max: number
}

// Global metrics storage using running stats accumulator
const metrics = new Map<string, RunningStats>()

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
  const existing = metrics.get(name)
  if (!existing) {
    metrics.set(name, { count: 1, sum: value, min: value, max: value })
  } else {
    existing.count++
    existing.sum += value
    existing.min = Math.min(existing.min, value)
    existing.max = Math.max(existing.max, value)
  }
}

/**
 * Get aggregated metrics
 * @returns Record of metric name to statistics
 */
export function getMetrics(): Record<string, MetricStats> {
  const result: Record<string, MetricStats> = {}

  for (const [name, stats] of metrics.entries()) {
    if (stats.count === 0) continue

    const avg = stats.sum / stats.count

    result[name] = {
      count: stats.count,
      avg: Math.round(avg * 100) / 100,
      max: Math.round(stats.max * 100) / 100,
      min: Math.round(stats.min * 100) / 100,
      total: Math.round(stats.sum * 100) / 100,
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
