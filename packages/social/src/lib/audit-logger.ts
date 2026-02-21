// Audit logger for compliance-sensitive social actions
// Non-blocking, sanitized, truncated content previews

import { createLogger } from './social-logger'
import { requestContext } from './request-context'

const auditLoggerInstance = createLogger('social:audit')

export type AuditAction =
  | 'post.create' | 'post.update' | 'post.delete' | 'post.schedule'
  | 'account.connect' | 'account.disconnect'
  | 'token.refresh' | 'token.revoke'
  | 'approval.submit' | 'approval.approve' | 'approval.reject' | 'approval.revoke'

export interface AuditEvent {
  action: AuditAction
  userId: string
  platform: string
  accountId?: string
  contentPreview?: string
  metadata?: Record<string, unknown>
}

const MAX_PREVIEW_LENGTH = 100

export function auditLog(event: AuditEvent): void {
  try {
    const ctx = requestContext.get()

    const entry: Record<string, unknown> = {
      type: 'audit',
      action: event.action,
      userId: event.userId,
      platform: event.platform,
    }

    if (event.accountId) entry.accountId = event.accountId
    if (ctx?.requestId) entry.requestId = ctx.requestId

    if (event.contentPreview) {
      entry.contentPreview = event.contentPreview.length > MAX_PREVIEW_LENGTH
        ? event.contentPreview.slice(0, MAX_PREVIEW_LENGTH) + '...'
        : event.contentPreview
    }

    if (event.metadata) {
      entry.metadata = sanitizeMetadata(event.metadata)
    }

    auditLoggerInstance.info(`audit:${event.action}`, entry)
  } catch {
    // Non-blocking -- never throw from audit logging
  }
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['token', 'secret', 'password', 'key', 'authorization', 'bearer']
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
