import type { CrawlSchedule } from '../types/crawler-types.js'

export interface CreateScheduleInput {
  name: string
  cron: string
  templateId: string
  userId: string
}

/**
 * Manages scheduled crawl jobs with cron expressions.
 * Basic cron parsing for simple patterns (minute hour day month weekday).
 * In-memory storage - Prisma integration deferred to API routes.
 */
export class JobScheduler {
  private schedules: Map<string, CrawlSchedule>

  constructor() {
    this.schedules = new Map()
  }

  /**
   * Generate unique schedule ID
   */
  private generateScheduleId(): string {
    return crypto.randomUUID()
  }

  /**
   * Parse simple cron expression and get next run time
   * Supports basic patterns: "0 * * * *" (hourly), "0 0 * * *" (daily), etc.
   */
  getNextRunTime(cron: string): Date | null {
    const parts = cron.trim().split(/\s+/)
    if (parts.length !== 5) return null

    const now = new Date()
    const next = new Date(now)

    const [minute, hour, day, month, weekday] = parts

    // Simple hourly pattern: "0 * * * *"
    if (minute !== '*' && hour === '*' && day === '*' && month === '*' && weekday === '*') {
      const targetMinute = parseInt(minute, 10)
      next.setMinutes(targetMinute, 0, 0)
      if (next <= now) {
        next.setHours(next.getHours() + 1)
      }
      return next
    }

    // Simple daily pattern: "0 0 * * *"
    if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
      const targetHour = parseInt(hour, 10)
      const targetMinute = parseInt(minute, 10)
      next.setHours(targetHour, targetMinute, 0, 0)
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      return next
    }

    // Fallback: add 1 hour for unknown patterns
    next.setHours(next.getHours() + 1)
    return next
  }

  /**
   * Check if schedule is due to run
   */
  isDue(schedule: CrawlSchedule): boolean {
    if (!schedule.isActive) return false
    if (!schedule.nextRunAt) return false

    const nextRun = new Date(schedule.nextRunAt)
    return nextRun <= new Date()
  }

  /**
   * Create a new schedule
   */
  createSchedule(input: CreateScheduleInput): CrawlSchedule {
    const now = new Date().toISOString()
    const nextRunAt = this.getNextRunTime(input.cron)

    const schedule: CrawlSchedule = {
      id: this.generateScheduleId(),
      name: input.name,
      cron: input.cron,
      templateId: input.templateId,
      isActive: true,
      nextRunAt: nextRunAt?.toISOString(),
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    }

    this.schedules.set(schedule.id, schedule)
    return schedule
  }

  /**
   * List all schedules for a user
   */
  listSchedules(userId: string): CrawlSchedule[] {
    const userSchedules = Array.from(this.schedules.values()).filter(
      (s) => s.userId === userId
    )
    return userSchedules.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  /**
   * Get a schedule by ID
   */
  getSchedule(scheduleId: string): CrawlSchedule | null {
    return this.schedules.get(scheduleId) ?? null
  }

  /**
   * Toggle schedule active status
   */
  toggleSchedule(scheduleId: string, active: boolean): CrawlSchedule | null {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) return null

    schedule.isActive = active
    schedule.updatedAt = new Date().toISOString()

    if (active && !schedule.nextRunAt) {
      const nextRun = this.getNextRunTime(schedule.cron)
      schedule.nextRunAt = nextRun?.toISOString()
    }

    this.schedules.set(scheduleId, schedule)
    return schedule
  }

  /**
   * Delete a schedule
   */
  deleteSchedule(scheduleId: string): boolean {
    return this.schedules.delete(scheduleId)
  }

  /**
   * Update schedule after execution
   */
  updateAfterRun(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) return

    const now = new Date().toISOString()
    schedule.lastRunAt = now
    schedule.nextRunAt = this.getNextRunTime(schedule.cron)?.toISOString()
    schedule.updatedAt = now

    this.schedules.set(scheduleId, schedule)
  }

  /**
   * Clear all schedules (for testing)
   */
  clearSchedules(): void {
    this.schedules.clear()
  }
}
