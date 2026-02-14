# Platform Clients Usage Guide

## Overview
Social package now supports 7 platforms: Instagram, Twitter, LinkedIn, Bluesky, Facebook, Threads, and TikTok.

## Usage Examples

### Facebook Client

```typescript
import { FacebookClient } from '@creator-studio/social/facebook'
import { getPlatformClient } from '@creator-studio/social/factory'

// Direct instantiation
const fbClient = new FacebookClient(
  userAccessToken,
  pageId,
  pageAccessToken,
  appId,      // optional, required for token refresh
  appSecret   // optional, required for token refresh
)

// Via factory
const client = getPlatformClient('facebook', userAccessToken, {
  pageId: 'your-page-id',
  pageAccessToken: 'page-token',
  appId: 'app-id',
  appSecret: 'app-secret'
})

// Post text
await client.post({
  content: 'Hello Facebook!',
  mediaUrls: [],
  userId: pageId
})

// Post photo
await client.post({
  content: 'Check out this photo',
  mediaUrls: ['https://example.com/image.jpg'],
  userId: pageId
})

// Post video
await client.post({
  content: 'Watch this video',
  mediaUrls: ['https://example.com/video.mp4'],
  userId: pageId
})
```

### Threads Client

```typescript
import { ThreadsClient } from '@creator-studio/social/threads'

const threadsClient = new ThreadsClient(
  accessToken,
  userId,     // optional, fetched from API if not provided
  appId,      // optional, required for token refresh
  appSecret   // optional, required for token refresh
)

// Post text (hashtag limit enforced automatically)
await threadsClient.post({
  content: 'First #hashtag is clickable, #second is not',
  mediaUrls: [],
  userId: threadsUserId
})

// Post with image
await threadsClient.post({
  content: 'Photo post',
  mediaUrls: ['https://example.com/image.jpg'],
  userId: threadsUserId
})

// Post with video
await threadsClient.post({
  content: 'Video post',
  mediaUrls: ['https://example.com/video.mp4'],
  userId: threadsUserId
})
```

### TikTok Client

```typescript
import { TikTokClient } from '@creator-studio/social/tiktok'

const tiktokClient = new TikTokClient(
  accessToken,
  openId,           // optional
  clientKey,        // optional, required for token refresh
  clientSecret,     // optional, required for token refresh
  refreshToken      // optional, required for token refresh
)

// Post video (TikTok only supports video)
await tiktokClient.post({
  content: 'Check out my video! #TikTok',
  mediaUrls: ['https://example.com/video.mp4'], // exactly 1 video required
  userId: openId
})

// Auto-detects upload method:
// - Videos < 64MB: direct upload
// - Videos > 64MB: chunked upload (10MB chunks)
```

## Platform Factory

```typescript
import { getPlatformClient, PLATFORM_CONFIGS } from '@creator-studio/social/factory'

// Get platform config
const config = PLATFORM_CONFIGS.facebook
console.log(config.maxContentLength) // 63206

// Create client dynamically
function createClient(platform: SocialPlatform, token: string, params: any) {
  return getPlatformClient(platform, token, params)
}
```

## Required Parameters

### Facebook
- `accessToken`: User access token
- `pageId`: Facebook Page ID
- `pageAccessToken`: Page access token (from exchangeForPageToken)
- `appId`: Facebook App ID (optional, for token refresh)
- `appSecret`: Facebook App Secret (optional, for token refresh)

### Threads
- `accessToken`: User access token
- `userId`: Threads user ID (optional, auto-fetched)
- `appId`: Meta App ID (optional, for token refresh)
- `appSecret`: Meta App Secret (optional, for token refresh)

### TikTok
- `accessToken`: TikTok access token
- `openId`: User open ID (optional)
- `clientKey`: TikTok client key (optional, for token refresh)
- `clientSecret`: TikTok client secret (optional, for token refresh)
- `refreshToken`: TikTok refresh token (optional, for token refresh)

## Meta API Helpers

```typescript
import {
  metaGraphFetch,
  refreshLongLivedToken,
  pollContainerStatus,
  parseMetaError
} from '@creator-studio/social/meta-helpers'

// Generic Graph API call
const data = await metaGraphFetch('/me', {
  accessToken,
  body: { fields: 'id,name' }
})

// Exchange for long-lived token (60 days)
const result = await refreshLongLivedToken(accessToken, appId, appSecret)

// Poll container (for IG/Threads)
const status = await pollContainerStatus(accessToken, containerId)
```

## Token Refresh

All clients implement `refreshToken()`:

```typescript
// Facebook
const { accessToken, expiresIn } = await fbClient.refreshToken()

// Threads
const { accessToken, expiresIn } = await threadsClient.refreshToken()

// TikTok (also returns new refresh token)
const { accessToken, expiresIn } = await tiktokClient.refreshToken()
```

## Error Handling

All clients throw descriptive errors:

```typescript
try {
  await client.post({ content, mediaUrls, userId })
} catch (error) {
  // Facebook: "Meta API error: {message} (code: {code}, trace: {fbTraceId})"
  // Threads: "Threads container creation error: {details}"
  // TikTok: "TikTok API error: {message} (code: {code})"
  console.error(error.message)
}
```

## Platform-Specific Notes

### Facebook
- Supports text, photo, video posts
- Multiple photos currently use first image only (carousel support planned)
- Requires Page access token, not user token
- Insights available immediately after posting

### Threads
- Only first hashtag is clickable (enforced automatically)
- Container-based publishing: create → poll → publish
- Max 500 characters
- Up to 20 media items (but typically 1)

### TikTok
- Video-only platform (requires exactly 1 video URL)
- Auto-selects direct vs chunked upload based on size
- Poll-based publish (can take 30-300 seconds)
- Analytics requires video.insights scope (not implemented)
