import createClient, { type Middleware } from 'openapi-fetch'

export interface CreatorStudioClientOptions {
  baseUrl: string
  apiKey: string
}

/**
 * Create a type-safe Creator Studio API client
 *
 * @example
 * ```ts
 * import { createCreatorStudioClient } from '@creator-studio/sdk'
 *
 * const client = createCreatorStudioClient({
 *   baseUrl: 'https://creatorstudio.example.com',
 *   apiKey: 'cs_your_api_key_here',
 * })
 *
 * // List posts
 * const { data } = await client.GET('/api/v1/posts', {
 *   params: { query: { limit: 10, offset: 0 } }
 * })
 *
 * // Create post
 * const { data: newPost } = await client.POST('/api/v1/posts', {
 *   body: {
 *     content: 'Hello world!',
 *     platform: 'instagram',
 *   }
 * })
 * ```
 */
export function createCreatorStudioClient({ baseUrl, apiKey }: CreatorStudioClientOptions) {
  const client = createClient({ baseUrl })

  // Add auth middleware
  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      request.headers.set('Authorization', `Bearer ${apiKey}`)
      return request
    },
  }

  client.use(authMiddleware)

  return client
}
