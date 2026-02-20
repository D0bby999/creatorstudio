// Zero-dep structured JSON logger for social package
// Level-filtered, context-aware, dev-friendly pretty print

import { requestContext } from './request-context'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_VALUES: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function getConfiguredLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel
  return env in LEVEL_VALUES ? env : 'info'
}

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export interface SocialLogger {
  debug(message: string, data?: Record<string, unknown>): void
  info(message: string, data?: Record<string, unknown>): void
  warn(message: string, data?: Record<string, unknown>): void
  error(message: string, data?: Record<string, unknown>): void
  child(bindings: Record<string, unknown>): SocialLogger
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return '[unserializable]'
  }
}

export function createLogger(name: string, bindings?: Record<string, unknown>): SocialLogger {
  const mergedBindings = bindings ?? {}

  function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LEVEL_VALUES[level] < LEVEL_VALUES[getConfiguredLevel()]) return

    const ctx = requestContext.get()
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      logger: name,
      requestId: ctx?.requestId ?? 'no-request-id',
      ...mergedBindings,
      message,
      ...(data ? { data } : {}),
    }

    const method = level === 'debug' ? 'log' : level
    if (isProduction()) {
      console[method](JSON.stringify(entry))
    } else {
      const prefix = `[${entry.level}] ${name}`
      const parts = [message]
      if (entry.requestId && entry.requestId !== 'no-request-id') parts.push(`rid=${entry.requestId}`)
      if (Object.keys(mergedBindings).length > 0) parts.push(safeStringify(mergedBindings))
      if (data) parts.push(safeStringify(data))
      console[method](`${prefix}: ${parts.join(' ')}`)
    }
  }

  return {
    debug: (msg, data?) => log('debug', msg, data),
    info: (msg, data?) => log('info', msg, data),
    warn: (msg, data?) => log('warn', msg, data),
    error: (msg, data?) => log('error', msg, data),
    child: (childBindings) =>
      createLogger(name, { ...mergedBindings, ...childBindings }),
  }
}

// No-op logger for when logging is not needed
export const noopLogger: SocialLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
}
