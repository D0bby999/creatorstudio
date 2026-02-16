# Phase 1A Architecture - Queue & Events Foundation

## Overview

Phase 1A implements the foundational queue and event system for the crawler engine.

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Crawler Engine (Phase 1B)                   │
│                     ┌──────────────────────┐                    │
│                     │ CrawlerEventEmitter  │                    │
│                     │  - requestStarted    │                    │
│                     │  - requestCompleted  │                    │
│                     │  - requestFailed     │                    │
│                     │  - crawlFinished     │                    │
│                     └──────────────────────┘                    │
│                              │                                   │
│                              ▼                                   │
│                 ┌────────────────────────┐                      │
│                 │ PersistentRequestQueue │                      │
│                 └────────────────────────┘                      │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              ▼                       ▼                          │
│     ┌─────────────────┐    ┌──────────────────┐               │
│     │   RedisQueue    │    │  InMemoryQueue   │               │
│     │  (Production)   │    │   (Fallback)     │               │
│     └─────────────────┘    └──────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Queue Strategy Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Request Addition Flow                                         │
└──────────────────────────────────────────────────────────────┘

  addRequest({ url })
        │
        ▼
  normalizeUniqueKey(url)
  - Lowercase host
  - Sort query params
  - Strip fragment
        │
        ▼
  Check if already processed
  (completed/failed/pending)
        │
        ├─ Already exists → return { wasAlreadyPresent: true }
        │
        └─ New request → Calculate score via QueueStrategy
                               │
                               ├─ BFS: score = insertionIndex
                               └─ DFS: score = -insertionIndex
                               │
                               ▼
                         Add to queue (sorted by score)
                               │
                               ▼
                         return { wasAlreadyPresent: false }
```

## Redis Data Structure

```
Key Namespace: crawler:queue:{queueId}:*

┌────────────────────────────────────────────────────────────────┐
│ crawler:queue:{id}:pending          (Sorted Set)               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Score (priority)  │  Member (uniqueKey)                  │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │      0.0          │  https://example.com/                │  │
│ │      1.0          │  https://example.com/page1           │  │
│ │      2.0          │  https://example.com/page2           │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ crawler:queue:{id}:data             (Hash)                     │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Key (uniqueKey)   │  Value (JSON CrawlRequest)           │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ example.com/      │  { url, method, headers, ... }       │  │
│ │ example.com/page1 │  { url, method, headers, ... }       │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ crawler:queue:{id}:completed        (Set)                      │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ https://example.com/                                      │  │
│ │ https://example.com/about                                 │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ crawler:queue:{id}:failed           (Set)                      │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ https://example.com/broken                                │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ crawler:queue:{id}:counter          (String/Integer)           │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Value: 42  (auto-incrementing insertion counter)          │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## In-Memory Fallback Structure

```
┌─────────────────────────────────────────────────────────────┐
│ InMemoryQueue                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  queue: Array<{ score, request }>  (sorted by score)        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [                                                     │  │
│  │   { score: 0, request: { url: 'example.com/' } },    │  │
│  │   { score: 1, request: { url: 'example.com/page1' }} │  │
│  │ ]                                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  data: Map<uniqueKey, CrawlRequest>                         │
│  completed: Set<uniqueKey>                                  │
│  failed: Set<uniqueKey>                                     │
│  insertionCounter: number                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Crawler Lifecycle Events                                     │
└──────────────────────────────────────────────────────────────┘

  Crawler Start
        │
        ▼
  ┌─────────────────┐
  │ requestStarted  │──→ { request: CrawlRequest }
  └─────────────────┘
        │
        ├─ Success ──→ ┌─────────────────────┐
        │              │ requestCompleted    │──→ { result: CrawlResult }
        │              └─────────────────────┘
        │
        └─ Failure ──→ ┌─────────────────┐
                       │ requestFailed   │──→ { request, error }
                       └─────────────────┘

  (All requests processed)
        │
        ▼
  ┌─────────────────┐
  │ crawlFinished   │──→ { stats, duration, errors }
  └─────────────────┘
```

## Module Dependencies

```
@creator-studio/crawler/queue
  ├─ @creator-studio/redis (getRedis)
  ├─ @upstash/redis (Redis type)
  └─ ../types/crawler-types

@creator-studio/crawler/engine
  └─ ../types/crawler-types
```

## File Size Summary

All files under 200 lines:
- crawler-types.ts: 130 lines
- crawler-events.ts: 65 lines
- queue-strategy.ts: 50 lines
- normalize-unique-key.ts: 24 lines
- in-memory-queue.ts: 68 lines
- redis-queue.ts: 109 lines
- persistent-request-queue.ts: 180 lines

## Next Phase

Phase 1B will build on this foundation:
- CrawlerEngine (orchestrator)
- CheerioCrawler (static HTML)
- BrowserCrawler (Puppeteer)
- Smart rendering detection
- Concurrency pool
- Rate limiting
