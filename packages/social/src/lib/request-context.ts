// AsyncLocalStorage-based request context propagation
// Provides requestId, userId, platform across async boundaries

import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestContext {
  requestId: string
  userId?: string
  accountId?: string
  platform?: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export const requestContext = {
  run: <T>(ctx: RequestContext, fn: () => T): T => storage.run(ctx, fn),
  get: (): RequestContext | undefined => storage.getStore(),
  getRequestId: (): string => storage.getStore()?.requestId ?? 'no-request-id',
  getUserId: (): string | undefined => storage.getStore()?.userId,
  getPlatform: (): string | undefined => storage.getStore()?.platform,
}
