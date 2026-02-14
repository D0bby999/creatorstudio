/**
 * AI-powered content scheduling suggestions
 * Provides optimal posting times based on platform best practices
 */

interface PostingTime {
  day: string
  hour: number
  score: number
}

interface PlatformSchedule {
  name: string
  bestTimes: { day: string; hours: number[] }[]
}

const PLATFORM_SCHEDULES: Record<string, PlatformSchedule> = {
  instagram: {
    name: 'Instagram',
    bestTimes: [
      { day: 'Monday', hours: [11, 13] },
      { day: 'Tuesday', hours: [11, 13, 19] },
      { day: 'Wednesday', hours: [11, 14] },
      { day: 'Thursday', hours: [11, 13, 19] },
      { day: 'Friday', hours: [10, 13] },
      { day: 'Saturday', hours: [10, 12] },
      { day: 'Sunday', hours: [10, 12] },
    ],
  },
  twitter: {
    name: 'Twitter',
    bestTimes: [
      { day: 'Monday', hours: [8, 12, 17] },
      { day: 'Tuesday', hours: [8, 10, 12] },
      { day: 'Wednesday', hours: [8, 10, 17] },
      { day: 'Thursday', hours: [8, 10, 12] },
      { day: 'Friday', hours: [8, 10] },
      { day: 'Saturday', hours: [10, 12] },
      { day: 'Sunday', hours: [10, 12] },
    ],
  },
  tiktok: {
    name: 'TikTok',
    bestTimes: [
      { day: 'Monday', hours: [6, 10, 19] },
      { day: 'Tuesday', hours: [2, 4, 9] },
      { day: 'Wednesday', hours: [7, 9, 19] },
      { day: 'Thursday', hours: [9, 12, 19] },
      { day: 'Friday', hours: [5, 13, 15] },
      { day: 'Saturday', hours: [11, 19, 20] },
      { day: 'Sunday', hours: [7, 9, 16] },
    ],
  },
  linkedin: {
    name: 'LinkedIn',
    bestTimes: [
      { day: 'Monday', hours: [9, 12] },
      { day: 'Tuesday', hours: [9, 11, 12] },
      { day: 'Wednesday', hours: [9, 11, 12] },
      { day: 'Thursday', hours: [9, 11] },
      { day: 'Friday', hours: [9, 11] },
      { day: 'Saturday', hours: [] },
      { day: 'Sunday', hours: [] },
    ],
  },
  youtube: {
    name: 'YouTube',
    bestTimes: [
      { day: 'Monday', hours: [14, 17] },
      { day: 'Tuesday', hours: [14, 17] },
      { day: 'Wednesday', hours: [14, 17] },
      { day: 'Thursday', hours: [12, 15, 17] },
      { day: 'Friday', hours: [12, 15, 17] },
      { day: 'Saturday', hours: [9, 11, 14] },
      { day: 'Sunday', hours: [9, 11, 14] },
    ],
  },
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * DST-aware timezone offset using Intl.DateTimeFormat
 * Returns hours from UTC (e.g., -4 for EDT, -5 for EST)
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const tzPart = parts.find(p => p.type === 'timeZoneName')
    if (!tzPart) return 0

    // Parse "GMT", "GMT-4", "GMT+5:30"
    if (tzPart.value === 'GMT') return 0
    const match = tzPart.value.match(/GMT([+-]?\d+)(?::(\d+))?/)
    if (!match) return 0
    const hours = parseInt(match[1], 10)
    const minutes = match[2] ? parseInt(match[2], 10) : 0
    return hours + (minutes / 60) * Math.sign(hours || 1)
  } catch {
    return 0
  }
}

/**
 * Suggest optimal posting times for a platform
 * Returns top 5 time slots with engagement scores
 * Timezone adjusts hours dynamically (DST-aware)
 */
export async function suggestPostingTimes(
  platform: string,
  timezone?: string
): Promise<PostingTime[]> {
  const schedule = PLATFORM_SCHEDULES[platform.toLowerCase()]

  if (!schedule) {
    throw new Error(`Platform ${platform} not supported`)
  }

  const timezoneOffset = timezone ? getTimezoneOffset(timezone) : 0
  const suggestions: PostingTime[] = []

  for (const daySchedule of schedule.bestTimes) {
    for (const hour of daySchedule.hours) {
      let adjustedHour = hour + timezoneOffset
      let adjustedDay = daySchedule.day

      if (adjustedHour < 0) {
        adjustedHour += 24
        const currentDayIndex = DAYS.indexOf(daySchedule.day)
        adjustedDay = DAYS[(currentDayIndex - 1 + 7) % 7]
      } else if (adjustedHour >= 24) {
        adjustedHour -= 24
        const currentDayIndex = DAYS.indexOf(daySchedule.day)
        adjustedDay = DAYS[(currentDayIndex + 1) % 7]
      }

      const baseScore = 85
      const hourBonus = daySchedule.hours.length > 2 ? 10 : 5
      const weekendPenalty = ['Saturday', 'Sunday'].includes(adjustedDay) ? -5 : 0

      suggestions.push({
        day: adjustedDay,
        hour: adjustedHour,
        score: Math.min(100, baseScore + hourBonus + weekendPenalty),
      })
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
