/**
 * Utility functions for parsing Facebook post data:
 * relative timestamps, numeric counts with K/M/B suffixes
 */

export function parseRelativeTimestamp(text: string): Date | null {
  if (!text) return null
  const now = new Date()
  const lower = text.toLowerCase().trim()

  // "Just now"
  if (lower === 'just now') return now

  // "X mins/minutes/hours/hrs/seconds/secs ago"
  const agoMatch = lower.match(/(\d+)\s*(second|sec|minute|min|hour|hr|day|week|month|year)s?\s*ago/)
  if (agoMatch) {
    const value = parseInt(agoMatch[1], 10)
    const unit = agoMatch[2]
    const ms: Record<string, number> = {
      second: 1000, sec: 1000,
      minute: 60000, min: 60000,
      hour: 3600000, hr: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000,
    }
    const multiplier = ms[unit]
    if (multiplier) return new Date(now.getTime() - value * multiplier)
  }

  // "Yesterday at HH:MM AM/PM"
  if (lower.startsWith('yesterday')) {
    const timeMatch = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10)
      if (timeMatch[3]?.toLowerCase() === 'pm' && hours < 12) hours += 12
      if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0
      d.setHours(hours, parseInt(timeMatch[2], 10), 0, 0)
    }
    return d
  }

  // Try native Date.parse as fallback (handles "March 5 at 10:00 AM" etc.)
  const parsed = Date.parse(text.replace(' at ', ' '))
  if (!isNaN(parsed)) return new Date(parsed)

  return null
}

export function parseNumericCount(text: string): number {
  if (!text) return 0
  const cleaned = text.replace(/[,\s]/g, '')
  const match = cleaned.match(/([\d.]+)\s*([KMBkmb])?/)
  if (!match) return 0
  const value = parseFloat(match[1])
  const suffix = (match[2] || '').toUpperCase()
  const multipliers: Record<string, number> = { K: 1000, M: 1000000, B: 1000000000 }
  return Math.round(value * (multipliers[suffix] || 1))
}
