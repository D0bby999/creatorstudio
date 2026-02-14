/**
 * Format a number with thousand separators
 * @example formatNumber(1234) // "1,234"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Get time-of-day greeting with user name
 * @example getGreeting("Alice") // "Good morning, Alice"
 */
export function getGreeting(name: string): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return `Good morning, ${name}`
  } else if (hour < 18) {
    return `Good afternoon, ${name}`
  } else {
    return `Good evening, ${name}`
  }
}
