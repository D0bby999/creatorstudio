# Persistent Request Queue

Redis-backed request queue with in-memory fallback for the crawler engine.

## Features

- **Deduplication**: URL normalization prevents duplicate requests
- **Ordering Strategies**: BFS (breadth-first) or DFS (depth-first) crawling
- **Graceful Fallback**: Automatic in-memory queue when Redis unavailable
- **Batch Operations**: Blocking and non-blocking batch request addition
- **Completion Tracking**: Track completed and failed requests

## Architecture

```
PersistentRequestQueue (Facade)
├── RedisQueue (when Redis available)
│   ├── Sorted Set: crawler:queue:{id}:pending (priority ordering)
│   ├── Hash: crawler:queue:{id}:data (request objects)
│   ├── Set: crawler:queue:{id}:completed
│   ├── Set: crawler:queue:{id}:failed
│   └── Counter: crawler:queue:{id}:counter
└── InMemoryQueue (fallback)
    ├── Sorted Array (priority ordering)
    ├── Map (request objects)
    ├── Set (completed)
    └── Set (failed)
```

## Usage

### Basic Usage

```typescript
import { PersistentRequestQueue, createQueueStrategy } from '@creator-studio/crawler/queue'

// Create queue with BFS strategy
const queue = new PersistentRequestQueue({
  queueId: 'my-crawl',
  strategy: createQueueStrategy('bfs')
})

// Add requests
await queue.addRequest({ url: 'https://example.com' })
await queue.addRequest({
  url: 'https://example.com/page2',
  depth: 1,
  maxRetries: 5
})

// Fetch next request
const request = await queue.fetchNextRequest()
if (request) {
  // Process request...
  await queue.markCompleted(request.uniqueKey)
}

// Get statistics
const stats = await queue.getStats()
console.log(stats) // { pending: 0, completed: 1, failed: 0, total: 1 }
```

### Batch Operations

```typescript
// Blocking batch (waits for all)
const urls = Array.from({ length: 100 }, (_, i) => ({
  url: `https://example.com/page${i}`
}))
const results = await queue.addRequests(urls, 25) // batch size 25

// Non-blocking batch (returns after first batch)
await queue.addRequestsBatched(urls, {
  batchSize: 25,
  waitBetweenBatchesMillis: 100
})
```

### Queue Strategies

**BFS (Breadth-First Search)**
- FIFO ordering
- Processes requests in insertion order
- Good for level-by-level crawling

```typescript
const strategy = createQueueStrategy('bfs')
```

**DFS (Depth-First Search)**
- LIFO ordering (newest first)
- Follows links immediately
- Good for deep crawling

```typescript
const strategy = createQueueStrategy('dfs')
```

## URL Normalization

URLs are normalized for deduplication:

```typescript
import { normalizeUniqueKey } from '@creator-studio/crawler/queue'

// These resolve to the same key
normalizeUniqueKey('https://Example.com/path?b=2&a=1#hash')
normalizeUniqueKey('https://example.com/path?a=1&b=2')
// Both => 'https://example.com/path?a=1&b=2'
```

Normalization rules:
- Lowercase hostname
- Sort query parameters alphabetically
- Strip URL fragment (#hash)
- Invalid URLs => lowercased as-is

## Redis vs In-Memory

The queue automatically detects Redis availability:

```typescript
// With Redis (from @creator-studio/redis package)
const queue = new PersistentRequestQueue({
  queueId: 'crawl-1',
  strategy: createQueueStrategy('bfs')
  // Uses getRedis() automatically
})

// Force specific Redis instance
import { Redis } from '@upstash/redis'
const customRedis = new Redis({ url: '...', token: '...' })
const queue = new PersistentRequestQueue({
  queueId: 'crawl-1',
  strategy: createQueueStrategy('bfs'),
  redis: customRedis
})
```

Console output when Redis unavailable:
```
[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-memory fallback
```

## File Structure

```
queue/
├── index.ts                         # Module exports
├── persistent-request-queue.ts      # Main API facade
├── redis-queue.ts                   # Redis implementation
├── in-memory-queue.ts               # In-memory implementation
├── queue-strategy.ts                # BFS/DFS strategies
├── normalize-unique-key.ts          # URL normalization
└── __tests__/
    └── queue-integration.test.ts    # Integration tests
```

## Performance

- **In-Memory**: O(n log n) insertion, O(1) fetch
- **Redis**: O(log n) insertion, O(1) fetch
- **Batch Size**: Default 25, configurable
- **Background Processing**: Uses setImmediate for non-blocking batches

## Types

```typescript
interface CrawlRequest {
  url: string
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  userData?: Record<string, unknown>
  uniqueKey: string
  retryCount: number
  maxRetries: number
  noRetry?: boolean
  label?: string
  depth?: number
}

interface QueueStats {
  pending: number
  completed: number
  failed: number
  total: number
}

interface QueueOperationInfo {
  wasAlreadyPresent: boolean
  uniqueKey: string
}
```
