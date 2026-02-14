# @creator-studio/sdk

Type-safe TypeScript SDK for the Creator Studio API.

## Installation

```bash
pnpm add @creator-studio/sdk
```

## Usage

### Create a client

```typescript
import { createCreatorStudioClient } from '@creator-studio/sdk'

const client = createCreatorStudioClient({
  baseUrl: 'https://creatorstudio.example.com',
  apiKey: 'cs_your_api_key_here',
})
```

### List posts

```typescript
const { data, error } = await client.GET('/api/v1/posts', {
  params: {
    query: {
      limit: 10,
      offset: 0,
    },
  },
})

if (data) {
  console.log('Posts:', data.posts)
}
```

### Create a post

```typescript
const { data, error } = await client.POST('/api/v1/posts', {
  body: {
    content: 'Hello world!',
    platform: 'instagram',
  },
})

if (data) {
  console.log('Created post:', data.post)
}
```

### Get user profile

```typescript
const { data } = await client.GET('/api/v1/users/me')

if (data) {
  console.log('User:', data.user)
}
```

### Verify API key

```typescript
const { data } = await client.GET('/api/v1/auth/verify')

if (data) {
  console.log('Authenticated:', data.authenticated)
  console.log('Scopes:', data.scopes)
}
```

## Type Generation

To generate TypeScript types from the OpenAPI spec:

```bash
cd packages/sdk
pnpm exec openapi-typescript ../../apps/web/public/api/v1/openapi.json -o src/schema.d.ts
```

Then update `src/client.ts` to import and use the generated types:

```typescript
import type { paths } from './schema'

export function createCreatorStudioClient(...) {
  return createClient<paths>({ baseUrl })
}
```

## API Reference

See the full OpenAPI specification at `/api/v1/openapi.json` on your Creator Studio instance.
