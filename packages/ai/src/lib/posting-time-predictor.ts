/**
 * Posting time prediction using data analysis + static best practices
 */

// Types
export interface EngagementData {
  day: string
  hour: number
  engagementRate: number
  postCount: number
}

export interface PredictedPostingTime {
  day: string
  hour: number
  score: number
  source: 'data' | 'static' | 'blended'
}

// Static best posting hours by platform (derived from industry research)
const STATIC_BEST_HOURS: Record<string, Record<string, number[]>> = {
  instagram: {
    Monday: [11, 13],
    Tuesday: [11, 13, 19],
    Wednesday: [11, 14],
    Thursday: [11, 13, 19],
    Friday: [10, 13],
    Saturday: [10, 12],
    Sunday: [10, 12],
  },
  twitter: {
    Monday: [8, 12, 17],
    Tuesday: [8, 10, 12],
    Wednesday: [8, 10, 17],
    Thursday: [8, 10, 12],
    Friday: [8, 10],
    Saturday: [10, 12],
    Sunday: [10, 12],
  },
  tiktok: {
    Monday: [6, 10, 19],
    Tuesday: [2, 4, 9],
    Wednesday: [7, 9, 19],
    Thursday: [9, 12, 19],
    Friday: [5, 13, 15],
    Saturday: [11, 19, 20],
    Sunday: [7, 9, 16],
  },
  linkedin: {
    Monday: [9, 12],
    Tuesday: [9, 11, 12],
    Wednesday: [9, 11, 12],
    Thursday: [9, 11],
    Friday: [9, 11],
    Saturday: [],
    Sunday: [],
  },
  youtube: {
    Monday: [14, 17],
    Tuesday: [14, 17],
    Wednesday: [14, 17],
    Thursday: [12, 15, 17],
    Friday: [12, 15, 17],
    Saturday: [9, 11, 14],
    Sunday: [9, 11, 14],
  },
}

const MIN_DATA_POINTS = 10

/**
 * Predict best posting times based on engagement data or static best practices
 * No AI call needed - pure data analysis
 */
export async function predictBestTimes(
  platform: string,
  engagementData?: EngagementData[]
): Promise<PredictedPostingTime[]> {
  const normalizedPlatform = platform.toLowerCase()

  // If no data or insufficient data, return static schedule
  if (!engagementData || engagementData.length < MIN_DATA_POINTS) {
    return getStaticTimes(normalizedPlatform).sort((a, b) => b.score - a.score).slice(0, 5)
  }

  // Calculate data-based scores
  const dataScores = calculateDataScores(engagementData)

  // Get static scores for blending
  const staticScores = getStaticTimes(normalizedPlatform)

  // Blend scores: 70% data, 30% static
  const blendedScores = blendScores(dataScores, staticScores, 0.7, 0.3)

  // Return top 5 times sorted by score
  return blendedScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function getStaticTimes(platform: string): PredictedPostingTime[] {
  const schedule = STATIC_BEST_HOURS[platform] || STATIC_BEST_HOURS.instagram
  const results: PredictedPostingTime[] = []
  for (const [day, hours] of Object.entries(schedule)) {
    for (const hour of hours) {
      results.push({ day, hour, score: 1.0, source: 'static' })
    }
  }
  return results
}

function calculateDataScores(data: EngagementData[]): PredictedPostingTime[] {
  const grouped = new Map<string, { total: number; count: number }>()
  for (const entry of data) {
    const key = `${entry.day}:${entry.hour}`
    const existing = grouped.get(key) || { total: 0, count: 0 }
    grouped.set(key, { total: existing.total + entry.engagementRate, count: existing.count + 1 })
  }

  let maxAvg = 0
  for (const { total, count } of grouped.values()) {
    const avg = total / count
    if (avg > maxAvg) maxAvg = avg
  }

  const results: PredictedPostingTime[] = []
  for (const [key, { total, count }] of grouped.entries()) {
    const [day, hourStr] = key.split(':')
    results.push({ day, hour: parseInt(hourStr, 10), score: maxAvg > 0 ? (total / count) / maxAvg : 0, source: 'data' })
  }
  return results
}

function blendScores(
  dataScores: PredictedPostingTime[],
  staticScores: PredictedPostingTime[],
  dataWeight: number,
  staticWeight: number
): PredictedPostingTime[] {
  const blended = new Map<string, number>()
  for (const item of [...dataScores, ...staticScores]) {
    const key = `${item.day}:${item.hour}`
    const weight = item.source === 'data' ? dataWeight : staticWeight
    blended.set(key, (blended.get(key) || 0) + item.score * weight)
  }

  const results: PredictedPostingTime[] = []
  for (const [key, score] of blended.entries()) {
    const [day, hourStr] = key.split(':')
    results.push({ day, hour: parseInt(hourStr, 10), score, source: 'blended' })
  }
  return results
}
