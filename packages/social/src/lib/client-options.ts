// Shared client options for dependency injection
// Used by all platform clients to accept resilient fetch + logger

import type { SocialLogger } from './social-logger'

export interface ClientOptions {
  fetchFn?: typeof fetch
  logger?: SocialLogger
}
