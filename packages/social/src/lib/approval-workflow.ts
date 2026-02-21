// Approval workflow state machine — pure functions, no DB, no network
// Caller handles persistence, authorization, and notifications

import type {
  ApprovalStatus,
  ApprovalEvent,
  ApprovalablePost,
  ApprovalTransitionResult,
  ApprovalWorkflowOptions,
} from '../types/social-types'
import { auditLog } from './audit-logger'

const VALID_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  none: ['pending_approval'],
  pending_approval: ['approved', 'rejected'],
  rejected: ['pending_approval'],
  approved: ['none'],
}

const AUDIT_ACTION_MAP: Record<string, 'approval.submit' | 'approval.approve' | 'approval.reject' | 'approval.revoke'> = {
  'none->pending_approval': 'approval.submit',
  'pending_approval->approved': 'approval.approve',
  'pending_approval->rejected': 'approval.reject',
  'approved->none': 'approval.revoke',
}

export class ApprovalTransitionError extends Error {
  constructor(
    public readonly from: ApprovalStatus,
    public readonly to: ApprovalStatus,
    public readonly reason: string,
  ) {
    super(`Invalid transition from '${from}' to '${to}': ${reason}`)
    this.name = 'ApprovalTransitionError'
  }
}

function validateTransition(from: ApprovalStatus, to: ApprovalStatus): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new ApprovalTransitionError(from, to, 'transition not allowed')
  }
}

function createApprovalEvent(
  postId: string,
  from: ApprovalStatus,
  to: ApprovalStatus,
  userId: string,
  comment?: string,
): ApprovalEvent {
  return {
    id: crypto.randomUUID(),
    postId,
    fromStatus: from,
    toStatus: to,
    userId,
    comment,
    timestamp: Date.now(),
  }
}

function emitAudit(postId: string, from: ApprovalStatus, to: ApprovalStatus, userId: string, comment?: string): void {
  const key = `${from}->${to}`
  const action = AUDIT_ACTION_MAP[key]
  if (action) {
    auditLog({
      action,
      userId,
      platform: 'internal',
      metadata: { postId, from, to, ...(comment ? { comment } : {}) },
    })
  }
}

export function submitForApproval(post: ApprovalablePost, submitterId: string): ApprovalTransitionResult {
  validateTransition(post.approvalStatus, 'pending_approval')

  const event = createApprovalEvent(post.id, post.approvalStatus, 'pending_approval', submitterId)
  emitAudit(post.id, post.approvalStatus, 'pending_approval', submitterId)

  return {
    post: {
      ...post,
      approvalStatus: 'pending_approval',
      approvalEvents: [...post.approvalEvents, event],
    },
    event,
  }
}

export function approvePost(
  post: ApprovalablePost,
  approverId: string,
  comment?: string,
  options?: ApprovalWorkflowOptions,
): ApprovalTransitionResult {
  if (!(options?.allowSelfApproval) && approverId === post.userId) {
    throw new ApprovalTransitionError(post.approvalStatus, 'approved', 'self-approval is not allowed')
  }

  validateTransition(post.approvalStatus, 'approved')

  const event = createApprovalEvent(post.id, post.approvalStatus, 'approved', approverId, comment)
  emitAudit(post.id, post.approvalStatus, 'approved', approverId, comment)

  return {
    post: {
      ...post,
      approvalStatus: 'approved',
      approvedBy: approverId,
      approvedAt: event.timestamp,
      approvalEvents: [...post.approvalEvents, event],
    },
    event,
  }
}

export function rejectPost(
  post: ApprovalablePost,
  reviewerId: string,
  reason: string,
): ApprovalTransitionResult {
  validateTransition(post.approvalStatus, 'rejected')

  const event = createApprovalEvent(post.id, post.approvalStatus, 'rejected', reviewerId, reason)
  emitAudit(post.id, post.approvalStatus, 'rejected', reviewerId, reason)

  return {
    post: {
      ...post,
      approvalStatus: 'rejected',
      approvalEvents: [...post.approvalEvents, event],
    },
    event,
  }
}

export function revokeApproval(
  post: ApprovalablePost,
  revokerId: string,
  reason?: string,
): ApprovalTransitionResult {
  validateTransition(post.approvalStatus, 'none')

  const event = createApprovalEvent(post.id, post.approvalStatus, 'none', revokerId, reason)
  emitAudit(post.id, post.approvalStatus, 'none', revokerId, reason)

  return {
    post: {
      ...post,
      approvalStatus: 'none',
      approvedBy: undefined,
      approvedAt: undefined,
      approvalEvents: [...post.approvalEvents, event],
    },
    event,
  }
}

export function canPublish(post: Pick<ApprovalablePost, 'approvalRequired' | 'approvalStatus'>): boolean {
  return !post.approvalRequired || post.approvalStatus === 'approved'
}

export function getApprovalHistory(events: ApprovalEvent[]): ApprovalEvent[] {
  return [...events].sort((a, b) => a.timestamp - b.timestamp)
}
