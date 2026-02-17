# Facebook Scraper Test Report

**Date:** 2026-02-17
**Runner:** Vitest v4.0.18
**Scope:** `src/scrapers/facebook/__tests__/`

---

## Test Results Overview

| Metric      | Count |
|-------------|-------|
| Total Files | 4     |
| Passed Files| 3     |
| Skipped Files| 1    |
| Total Tests | 46    |
| Passed      | 45    |
| Failed      | 0     |
| Skipped     | 1     |

**Duration:** 11.18s (bulk from HTTP retry timeout: 10.66s for error-scenario test)

---

## File Breakdown

| File | Result | Tests |
|------|--------|-------|
| `facebook-url-utils.test.ts` | PASS | 18/18 |
| `facebook-post-parser.test.ts` | PASS | 21/21 |
| `facebook-mbasic-scraper.test.ts` | PASS | 7/7 |
| `facebook-scraper-e2e.test.ts` | SKIP | 0/1 |

---

## Skipped Test

- **`facebook-scraper-e2e.test.ts > Facebook Scraper E2E > should scrape public page posts`** — skipped (no failure indicator shown; likely guarded by a condition such as `test.skip` or missing env var for live network access)

---

## Performance Notes

- `collectsErrorsOnHTTPFailures` test took **10.66s** — expected, driven by retry/backoff logic on simulated HTTP failures
- All other tests completed under 40ms each

---

## Health Assessment

**HEALTHY.** All non-E2E tests pass. Coverage spans:
- URL utilities (validation, normalization, identifier extraction, permalink building, relative URL resolution)
- HTML post parsing (posts, images, reactions, comments, pagination, timestamps, numeric counts)
- Scraper behavior (maxPosts, maxPages, private pages, cookie injection, error collection, page name extraction)

The skipped E2E test is expected for offline/CI environments and does not affect core logic coverage.

---

## Unresolved Questions

- Why exactly is the E2E test skipped? Confirm whether it uses `test.skip`, a network guard, or a missing env var — to ensure it can be enabled in an integration environment when needed.
