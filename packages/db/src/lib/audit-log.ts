import type { Prisma } from '@prisma/client'
import { prisma } from '../index'

export type AuditAction =
  | 'user.banned'
  | 'user.unbanned'
  | 'user.impersonated'
  | 'user.role_changed'
  | 'user.force_password_reset'

interface AuditLogEntry {
  actorId: string
  targetId?: string
  metadata?: Prisma.InputJsonValue
}

export async function logAudit(action: AuditAction, entry: AuditLogEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action,
      actorId: entry.actorId,
      targetId: entry.targetId,
      metadata: entry.metadata ?? {},
    },
  })
}

export async function getAuditLogs(options: {
  actorId?: string
  targetId?: string
  action?: string
  limit?: number
  offset?: number
}) {
  return prisma.auditLog.findMany({
    where: {
      ...(options.actorId && { actorId: options.actorId }),
      ...(options.targetId && { targetId: options.targetId }),
      ...(options.action && { action: options.action }),
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit ?? 50,
    skip: options.offset ?? 0,
    include: {
      actor: { select: { id: true, name: true, email: true } },
      target: { select: { id: true, name: true, email: true } },
    },
  })
}
