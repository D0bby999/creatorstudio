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

// UTC offset lookup for major timezones (hours from UTC)
const TIMEZONE_OFFSETS: Record<string, number> = {
  'America/New_York': -5,
  'America/Chicago': -6,
  'America/Denver': -7,
  'America/Los_Angeles': -8,
  'Europe/London': 0,
  'Europe/Paris': 1,
  'Europe/Berlin': 1,
  'Asia/Tokyo': 9,
  'Asia/Shanghai': 8,
  'Asia/Dubai': 4,
  'Australia/Sydney': 11,
  'Pacific/Auckland': 13,
  'UTC': 0,
}

/**
 * Suggest optimal posting times for a platform
 * Returns top 5 time slots with engagement scores
 * Timezone adjusts hours (e.g., 'America/New_York' shifts UTC times by -5)
 */
export async function suggestPostingTimes(
  platform: string,
  timezone?: string
): Promise<PostingTime[]> {
  const schedule = PLATFORM_SCHEDULES[platform.toLowerCase()]

  if (!schedule) {
    throw new Error(`Platform ${platform} not supported`)
  }

  // Get timezone offset (default to 0 for UTC)
  const timezoneOffset = timezone ? (TIMEZONE_OFFSETS[timezone] ?? 0) : 0

  const suggestions: PostingTime[] = []

  // Generate suggestions from platform best times
  for (const daySchedule of schedule.bestTimes) {
    for (const hour of daySchedule.hours) {
      // Apply timezone offset
      let adjustedHour = hour + timezoneOffset
      let adjustedDay = daySchedule.day

      // Handle day rollover when hour goes negative or >= 24
      if (adjustedHour < 0) {
        adjustedHour += 24
        // Day shift backward (simplified - doesn't account for week wrap)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const currentDayIndex = days.indexOf(daySchedule.day)
        adjustedDay = days[(currentDayIndex - 1 + 7) % 7]
      } else if (adjustedHour >= 24) {
        adjustedHour -= 24
        // Day shift forward
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const currentDayIndex = days.indexOf(daySchedule.day)
        adjustedDay = days[(currentDayIndex + 1) % 7]
      }

      // Calculate score based on popularity (more suggestions = higher score)
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

  // Sort by score and return top 5
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}
