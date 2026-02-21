# Code Review: Crawler Production Upgrade (4-Phase)

**Reviewer**: code-reviewer | **Date**: 2026-02-21
**Scope**: 50+ files across 4 phases + dashboard components
**Focus**: Security, error handling, pattern consistency, file sizes, resource cleanup, type safety

---

## Overall Assessment

The implementation is well-structured and follows established patterns (Crawlee/Apify architecture). Modular decomposition is solid -- most files are under 200 LOC. The social scrapers follow a consistent factory pattern with fallback strategies. However, there are **critical security gaps** (SSRF, credential leakage), a **performance bug** (double HTTP fetch in CheerioCrawler), and several **resource cleanup issues** that must be addressed before production use.

---

## Critical Issues

### C1. SSRF Protection Missing in All Social Scrapers [CRITICAL]

**Files affected**:
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/instagram/instagram-mobile-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/instagram/instagram-graphql-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/twitter/twitter-web-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/twitter/twitter-guest-api-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/tiktok/tiktok-web-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/tiktok/tiktok-embed-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/youtube/youtube-innertube-scraper.ts`
- `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/youtube/youtube-data-api-scraper.ts`

The `url-scraper.ts` and `browserless-scraper.ts` both call `resolveAndValidateUrl()` for SSRF protection, but **none of the social scrapers validate user-supplied URLs**. A user could supply `http://169.254.169.254/latest/meta-data/` as a "profile URL" and the HttpClient would happily fetch it.

**Impact**: Server-Side Request Forgery allows reading cloud metadata endpoints, internal services, and private IPs.

**Fix**: Each scraper factory function should validate the URL before passing to scrapers. Add validation in the factory entry points (`scrapeInstagram`, `scrapeTwitter`, `scrapeTikTok`, `scrapeYouTube`).

### C2. Hardcoded Twitter Bearer Token in Source Code [CRITICAL]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/twitter/twitter-guest-api-scraper.ts` (line 14)

```typescript
private bearerToken = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'
```

While this is Twitter's well-known public bearer token (used by many open-source scrapers), embedding credentials directly in source code violates security best practices. If this token is ever rotated or becomes private, the code must be redeployed.

**Fix**: Move to an environment variable with fallback:
```typescript
private bearerToken = process.env.TWITTER_BEARER_TOKEN ?? 'AAAA...'
```

### C3. YouTube API Key Leaked in URL Query String [CRITICAL]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/youtube/youtube-data-api-scraper.ts` (lines 98, 127, 137)

The YouTube API key is passed as a URL query parameter (`&key=${key}`) to `httpClient.get()`. If `got-scraping` or any middleware logs URLs (common in error handlers, monitoring), the API key will appear in plaintext in logs.

**Impact**: API key leakage via log files, error reports, and monitoring dashboards.

**Fix**: Pass the API key via a request header instead, or ensure URL-based keys are masked in any logging middleware.

---

## High Priority Issues

### H1. Double HTTP Fetch in CheerioCrawler [HIGH - Performance]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/cheerio-crawler.ts` (lines 30-45)

The `handleRequest` method performs two HTTP requests for the same URL:
1. Line 30: `httpClient.get(request.url, ...)` -- fetches the full response
2. Line 41: `scrapeUrl(request.url, ...)` -- internally creates another `httpClient.get()` call

This doubles network traffic and latency for every single request.

**Fix**: Pass the already-fetched HTML body to a parsing function instead of re-fetching. Extract the cheerio parsing from `scrapeUrl` into a separate `parseHtml(url, html)` function.

### H2. Signal Handlers Never Removed + process.exit(0) [HIGH - Reliability]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/state-persister.ts` (lines 101-119)

Problems:
1. `process.on('SIGTERM/SIGINT')` handlers are registered but **never removed**. If multiple CrawlerEngine instances are created, handlers accumulate (Node.js MaxListenersExceeded warning).
2. `process.exit(0)` on line 114 is called inside an async callback. This means the process exits immediately, potentially before other cleanup code runs. In a serverless environment, this kills the process.
3. The `signalHandlersRegistered` boolean is per-instance, not global. Multiple StatePersister instances bypass the guard.

**Fix**:
- Store handler references and remove them in a `cleanup()` method
- Remove `process.exit(0)` -- let the caller decide on exit behavior
- Use a module-level boolean for de-duplication

### H3. No Input Length Validation on Scraped URLs [HIGH - Security]

**All scraper files**

None of the URL extraction functions (`extractUsername`, `extractHandle`, `extractChannelId`) validate input length before parsing. A malicious user could supply a multi-megabyte string that triggers expensive regex backtracking.

**Fix**: Add `if (input.length > 2048) return null` guards to all URL parsing utility functions.

### H4. Untyped `any` Throughout Innertube Scraper [HIGH - Type Safety]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/youtube/youtube-innertube-scraper.ts`

Lines 44, 64: `as any` casts bypass type safety for Innertube's channel data. The entire metadata extraction chain is untyped, making it fragile to upstream library changes.

**Fix**: Define interfaces for the expected Innertube response shapes.

### H5. ErrorSnapshotter Creates New S3Client Per Upload [HIGH - Performance]

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/error-snapshotter.ts` (lines 59-87)

Every call to `uploadToR2` dynamically imports `@aws-sdk/client-s3` and creates a new `S3Client` instance. This is expensive (connection setup, TLS handshake) and should be cached.

**Fix**: Cache the S3Client as a class property, initialize once.

---

## Medium Priority Issues

### M1. Module-Level Singleton `httpClient` in CheerioCrawler

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/cheerio-crawler.ts` (line 6)

`const httpClient = new HttpClient()` is a module-level singleton shared across all CheerioCrawler instances. If different crawlers need different timeout configs, they'll conflict.

**Fix**: Make it an instance property initialized in the constructor.

### M2. Fingerprint Cache Eviction is FIFO, Not LRU

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/stealth/fingerprint-manager.ts` (lines 50-53)

The cache evicts the oldest entry (FIFO) rather than least-recently-used. Actively-used fingerprints could be evicted while stale ones remain.

**Fix**: On `get()`, delete and re-set the entry to move it to the end of the Map (simulating LRU). Or use an LRU cache library.

### M3. `retireWorstSession` Doesn't Invalidate Fingerprint

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/stealth/session-pool.ts` (lines 139-155)

The `retireWorstSession()` method deletes the session from the map but does not call `this.fingerprintManager.invalidate(session.fingerprintId)`, causing a fingerprint cache leak. Compare with the `retire()` method (line 91) which correctly invalidates.

**Fix**: Call `this.retire(worstSession.id)` instead of direct `this.sessions.delete()`.

### M4. `markBad` Also Leaks Fingerprint on Auto-Retire

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/stealth/session-pool.ts` (lines 71-83)

When `errorScore >= maxErrorScore`, the session is deleted via `this.sessions.delete(sessionId)` without fingerprint invalidation.

**Fix**: Replace `this.sessions.delete(sessionId)` with `this.retire(sessionId)`.

### M5. Duplicate JSDoc Comment Block in SessionPool

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/stealth/session-pool.ts` (lines 86-90)

There are two consecutive JSDoc comments:
```
/** Create new session */
/** Retire session by ID ... */
```
The first one ("Create new session") is orphaned -- it was probably meant for the now-private `createSession` method.

### M6. Pattern Inconsistency: Facebook Has Cookie Validation, Others Don't

**File comparison**: `facebook-types.ts` (line 68-74) has `buildCookieHeader` with safe-value regex validation. Instagram, Twitter, TikTok, YouTube scrapers pass user-supplied proxy URLs and headers with no sanitization.

**Fix**: Add proxy URL validation (at minimum, scheme check for http/https/socks5).

### M7. Missing `delay()` in Instagram Mobile Scraper

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/scrapers/instagram/instagram-mobile-scraper.ts`

Unlike all other scrapers which call `this.delay(this.config.requestDelayMs)` before returning, the mobile scraper does not wait. This means when used with pagination or rapid sequential calls, rate limiting is bypassed.

### M8. File Size Exceeds 200 LOC: `crawler-engine.ts` (205 lines)

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/crawler-engine.ts`

At 205 lines, this slightly exceeds the 200-line guideline. The `processRequest` method (lines 153-204) contains link discovery/enqueueing logic that could be extracted.

---

## Low Priority Issues

### L1. Chrome Version Hardcoded in stealth-headers.ts

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/stealth/stealth-headers.ts` (line 37)

`const chromeVersion = 130 + Math.floor(Math.random() * 2)` -- Chrome 130-131 will be outdated fast. Should derive from a config or auto-update mechanism.

### L2. Inconsistent Error Re-Throwing Pattern

Instagram mobile scraper (line 129) and GraphQL scraper (line 173) push an error to the errors array **and** rethrow. The factory catches the rethrown error and falls back. This means the error appears in the fallback result's errors array too, causing duplication if both strategies fail.

### L3. `getDomain` Oversimplified for TLD Edge Cases

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/engine/enqueue-links.ts` (line 162-165)

`getDomain` splits on `.` and takes last 2 parts. This fails for `.co.uk`, `.com.au`, etc. A URL like `https://news.bbc.co.uk` would extract `co.uk` instead of `bbc.co.uk`.

### L4. `waitForInFlight` Can Race

**File**: `/Users/dobby/Heroin/creatorstudio/packages/crawler/src/pool/autoscaled-pool.ts` (lines 182-185)

The `while (size > 0) { await Promise.race(...) }` pattern works but `Promise.race` doesn't remove settled promises. After race, the settled promise stays in the set until `finally` fires. If `.finally` is delayed, `inFlightTasks.size` might remain > 0 and the next `race` resolves instantly, causing a tight loop.

### L5. Dashboard Card Components Missing XSS Protection

**Files**: All `*-card.tsx` files render scraped content directly into JSX. React JSX auto-escapes text content, so this is safe by default. However, the `<img src={...}>` tags render URLs from scraped data without validation. A malicious page could return `javascript:` or `data:` URIs.

**Fix**: Validate image URLs start with `https://` before rendering.

---

## Edge Cases Found by Scouting

1. **TikTok short URLs (vm.tiktok.com, vt.tiktok.com)**: `extractUsername` only matches `/@username` patterns, so short URLs return null. The TikTok scraper factory would throw "Could not extract username from URL" instead of following the redirect.

2. **YouTube @handle resolution**: The Data API scraper passes `@handle` as a channel ID to the API, but the YouTube Data API requires a `forHandle=` parameter for handles, not `id=`. Fetching by `id=@handle` will return empty results.

3. **Instagram _sharedData deprecation**: Instagram removed `window._sharedData` from most pages in 2023. Both the mobile and GraphQL scrapers rely on it. These scrapers will likely return null profiles for most public profiles.

4. **Twitter syndication endpoint**: The `syndication.twitter.com/srv/timeline-profile` endpoint was deprecated when X rebranded. The web scraper will likely fail as the primary strategy.

5. **Race condition in CrawlerEngine.run()**: If `processRequest()` throws before `inFlightCount++` (line 157), the count will be wrong, but currently `inFlightCount++` is before the try block so this is fine. However, if `new URL(request.url)` in the crawlers throws, the `finally` block still decrements correctly.

---

## Positive Observations

- **Clean modular architecture**: Types, URL utils, scrapers, and factories are well-separated
- **Consistent factory pattern**: All platforms follow try-primary-then-fallback pattern matching Facebook's established approach
- **Error accumulation**: Scrapers collect non-fatal errors while continuing to scrape, good UX
- **Session pool with error scoring**: Crawlee-inspired session lifecycle management is solid
- **Resource monitoring**: Snapshotter + AutoscaledPool event loop monitoring is well-implemented
- **Dashboard components**: Clean, small, well-typed React components with proper lazy loading patterns
- **Good use of existing infrastructure**: Redis for state persistence, R2 for error snapshots

---

## Recommended Actions (Priority Order)

1. **[CRITICAL]** Add SSRF validation to all social scraper factory entry points
2. **[CRITICAL]** Move Twitter bearer token to env var with fallback
3. **[CRITICAL]** Mask or header-ize YouTube API key to prevent log leakage
4. **[HIGH]** Fix double HTTP fetch in CheerioCrawler -- extract HTML parsing from `scrapeUrl`
5. **[HIGH]** Fix signal handler cleanup in StatePersister (remove `process.exit(0)`)
6. **[HIGH]** Add input length validation to all URL parsing utilities
7. **[MEDIUM]** Fix fingerprint leak in `retireWorstSession` and `markBad`
8. **[MEDIUM]** Add `delay()` call to Instagram mobile scraper
9. **[MEDIUM]** Cache S3Client in ErrorSnapshotter
10. **[LOW]** Validate image URLs in dashboard card components

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 50+ |
| LOC reviewed | ~2,800 (core logic) |
| Files over 200 LOC | 1 (`crawler-engine.ts` at 205) |
| Critical issues | 3 |
| High priority | 5 |
| Medium priority | 8 |
| Low priority | 5 |
| Type safety issues | Moderate (several `any` casts, especially in YouTube/Instagram scrapers) |
| Test coverage | Facebook scraper has tests; no tests found for Instagram/Twitter/TikTok/YouTube scrapers |

---

## Unresolved Questions

1. Is the Instagram `_sharedData` scraping approach expected to work in production, or is it a placeholder for a browser-based approach?
2. Are the TikTok short URL redirects (vm.tiktok.com) expected to be handled by a higher-level redirect-following mechanism?
3. Should the YouTube Data API scraper handle `@handle` format via the `forHandle` API parameter?
4. What is the expected behavior when Redis is unavailable -- should StatePersister silently skip, or log a warning?
5. Should there be unit tests for the new scrapers before merging?
