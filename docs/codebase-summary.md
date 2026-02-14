# Codebase Summary

## Project Overview

Creator Studio is an all-in-one creative toolkit built as a Turborepo monorepo, consolidating image editing, video editing, web crawling, social management, and AI tools into a unified platform for content creators.

## Architecture

**Type:** Turborepo monorepo with React Router 7.12
**Package Manager:** pnpm@10.6.1
**Node Version:** >=20.19
**Build System:** Turbo 2.8.1 + Vite 6.3.6

## Monorepo Structure

```
creator-studio/
├── apps/
│   └── web/                      # Main React Router 7 application
│       ├── app/
│       │   ├── routes/           # File-based routing
│       │   ├── lib/              # App-level utilities
│       │   ├── root.tsx          # Root layout
│       │   └── routes.ts         # Route configuration
│       ├── vite.config.ts
│       └── package.json          (@creator-studio/web)
├── packages/
│   ├── db/                       # Prisma schema + client
│   │   ├── prisma/
│   │   │   └── schema.prisma     # PostgreSQL schema
│   │   └── src/
│   │       ├── index.ts          # Exports
│   │       └── client.ts         # Prisma client instance
│   ├── auth/                     # Better Auth configuration
│   │   └── src/
│   │       ├── auth-server.ts    # Server-side auth config
│   │       ├── auth-client.ts    # Client-side auth hooks
│   │       └── index.ts
│   └── ui/                       # Shared shadcn/ui components
│       └── src/
│           ├── components/       # Reusable UI components
│           ├── lib/              # Utility functions (cn, etc.)
│           └── styles/
│               └── globals.css   # Tailwind base styles
├── docs/                         # Project documentation
├── plans/                        # Development plans and reports
├── reference/                    # External reference projects
└── turbo.json                    # Turbo pipeline configuration
```

## Key Technologies

### Frontend Stack
- **Framework:** React 18.3.1
- **Router:** React Router 7.12 (SSR-capable)
- **Styling:** Tailwind CSS 4.1.0 + shadcn/ui
- **Build:** Vite 6.3.6
- **Language:** TypeScript 5.9.3 (strict mode)

### Backend Stack
- **Runtime:** Node.js 20.19+
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma 6.16.3
- **Auth:** Better Auth 1.4.18 (email/password + Google OAuth)

### Dev Tools
- **Linting:** ESLint 8 + TypeScript ESLint
- **Formatting:** Prettier 3.6.2 (single quotes, no semicolons)
- **Testing:** Vitest 3.2.1
- **Monorepo:** Turborepo 2.8.1

## Package Details

### `@creator-studio/web`
**Path:** `apps/web`
**Type:** React Router 7 SSR application

**Routes:**
- `/` → `routes/home.tsx`
- `/sign-in` → `routes/sign-in.tsx`
- `/sign-up` → `routes/sign-up.tsx`
- `/dashboard/*` → `routes/dashboard/` (layout + nested routes)
  - `/dashboard` → `index.tsx`
  - `/dashboard/canvas` → `canvas.tsx`
  - `/dashboard/video` → `video.tsx`
  - `/dashboard/crawler` → `crawler.tsx`
  - `/dashboard/social` → `social.tsx`
  - `/dashboard/ai` → `ai.tsx`
  - `/dashboard/organizations` → `organizations.tsx` (org list)
  - `/dashboard/organizations/:orgId` → `organizations.$orgId.tsx` (org detail + members/settings)
  - `/dashboard/api-keys` → `api-keys.tsx` (API key management)
  - `/dashboard/webhooks` → `webhooks.tsx` (webhook subscriptions)
  - `/dashboard/plugins/marketplace` → `plugins.marketplace.tsx` (browse plugins)
  - `/dashboard/plugins/installed` → `plugins.installed.tsx` (manage installed plugins)
- `/api/auth/*` → `routes/api.auth.$.ts` (Better Auth handler)
- `/api/organizations/*` → `routes/api.organizations.ts` (org CRUD + member management)
- `/api/api-keys` → `routes/api.api-keys.ts` (API key CRUD)
- `/api/webhooks` → `routes/api.webhooks.ts` (webhook CRUD)
- `/api/social` → `routes/api.social.ts` (Social platform management, posting)
- `/api/social/connect` → `routes/api.social.connect.ts` (Social platform connection)
- `/api/oauth/meta/authorize` → `routes/api.oauth.meta.authorize.ts` (Meta login)
- `/api/oauth/meta/callback` → `routes/api.oauth.meta.callback.ts` (Meta token exchange)
- `/api/oauth/tiktok/authorize` → `routes/api.oauth.tiktok.authorize.ts` (TikTok login)
- `/api/oauth/tiktok/callback` → `routes/api.oauth.tiktok.callback.ts` (TikTok token exchange)
- `/api/v1/*` → REST API v1 (public API with key auth)
  - `/api/v1/auth/verify` → Verify API key
  - `/api/v1/users/me` → Current user profile
  - `/api/v1/posts` → Create/list social posts
  - `/api/v1/plugins` → Plugin registry CRUD
  - `/api/v1/plugins/:id/install` → Install plugin
  - `/api/v1/plugins/:id/uninstall` → Uninstall plugin
  - `/api/v1/plugins/:id/approve` → Admin approve plugin
  - `/api/v1/openapi.json` → OpenAPI 3.1 specification
  - `/api/v1/zapier/posts/recent` → Recent posts (Zapier trigger)
  - `/api/v1/zapier/exports/recent` → Recent exports (Zapier trigger)

**Key Files:**
- `app/root.tsx` → Root layout with HTML structure
- `app/routes.ts` → Route configuration (includes org routes)
- `app/lib/auth-server.ts` → Server-side auth utilities
- `app/lib/auth-client.ts` → Client-side auth hooks
- `app/lib/api-key-auth.ts` → API key authentication (SHA-256 hashing, scope enforcement)
- `app/lib/api-rate-limiter.ts` → Token bucket rate limiter (100 req/min default)
- `app/components/organization-switcher.tsx` → Org selector in nav

### `@creator-studio/db`
**Path:** `packages/db`
**Exports:**
- `.` → `src/index.ts` (schema exports)
- `./client` → `src/client.ts` (Prisma client instance)

**Enhanced Capabilities:**
- **Advanced Queries** → Pagination, bulk operations, full-text search, soft delete, analytics
- **Seed Script** → Populate development database with realistic test data
- **34 Tests** → Comprehensive test coverage for all database operations

**Database Schema:**
- **User** → Core user model (id, name, email, emailVerified, image)
- **Session** → Better Auth sessions (token, expiresAt, ipAddress, userAgent)
- **Account** → OAuth providers + password storage (providerId, accessToken, refreshToken)
- **Verification** → Email/phone verification tokens
- **Project** → User-created projects (type: canvas | video, data: JSON)

**Key Files:**
- `src/client.ts` → Prisma client instance
- `src/queries/` → Advanced query helpers (pagination, search, soft delete)
- `src/seed.ts` → Database seeding script
- `src/*.test.ts` → 34 comprehensive tests

**Scripts:**
- `db:generate` → Generate Prisma client
- `db:push` → Push schema to database
- `db:migrate` → Run migrations
- `db:studio` → Open Prisma Studio
- `db:seed` → Populate test data

### `@creator-studio/auth`
**Path:** `packages/auth`
**Exports:**
- `.` → `src/index.ts`
- `./server` → `src/auth-server.ts`
- `./client` → `src/auth-client.ts`
- `./lib/rbac-helpers` → `src/lib/rbac-helpers.ts` (RBAC utilities)

**Enhanced Capabilities:**
- **Better Auth Plugins** → Two-factor auth (2FA), magic link authentication, organization roles
- **RBAC Helpers** → Role hierarchy (owner > admin > member), permission checks, role validation
- **Middleware Helpers** → requireAuth, requireRole, requireOrganizationRole
- **17 Tests** → Session validation, plugin configuration, middleware enforcement

**Configuration:**
- **Base Path:** `/api/auth`
- **Providers:** Email/password, Google OAuth, Magic Link
- **Session:** Cookie-based with 5-minute cache
- **Adapter:** Prisma adapter for PostgreSQL
- **Features:** 2FA, Organization support

**Key Files:**
- `src/auth-server.ts` → Better Auth configuration with plugins
- `src/auth-client.ts` → Client-side authentication hooks
- `src/middleware/` → Authentication middleware helpers
- `src/*.test.ts` → 17 comprehensive tests

### `@creator-studio/ui`
**Path:** `packages/ui`
**Exports:**
- `./globals.css` → Tailwind base styles + design tokens
- `./lib/*` → Utility functions (cn, etc.)
- `./components/base/*` → 23 shadcn/ui-style base components
- `./components/composites/*` → 6 composite components (higher-level UI patterns)

**Design System Architecture:**
- **Design Tokens** → CSS custom properties (`--color-primary`, `--spacing-unit`, etc.)
- **Tailwind Integration** → `@theme` directive maps tokens to TW4 utilities
- **CVA Pattern** → Class Variance Authority for component variants
- **Brand Color** → Teal/Cyan (#0891B2) as primary color
- **ThemeProvider** → Context-based theme management with localStorage persistence
- **SSR Script** → Prevents flash of unstyled content (theme hydration)
- **Dark Mode** → Full light/dark theme support via CSS variables

**Base Components (23 Total):**
- **Alert** → Notification and warning messages
- **Avatar** → User profile image + fallback initials
- **Badge** → Status/tag labels
- **Button** → Primary, secondary, destructive variants
- **Card** → Container component with shadow and borders
- **Dialog** → Modal overlay component
- **Dropdown** → Menu trigger with options
- **Input** → Text input with validation styling
- **Select** → Dropdown select component
- **Tabs** → Tabbed navigation interface
- **Tooltip** → Hover information popover
- **Breadcrumb** → Navigation hierarchy display
- **Sidebar** → Collapsible navigation container
- **Topbar** → Header navigation bar
- **BottomTabs** → Mobile-optimized tab bar (iOS-style)
- **Checkbox**, **Radio**, **Slider**, **Switch**, **Textarea**, **Label**, **Separator**, **Spinner**, **Skeleton**

**Composite Components (6 Total):**
- **Split-Screen Auth** → Two-column layout for sign-in/sign-up
- **Collapsible Sidebar** → Responsive sidebar with expand/collapse animation
- **Mobile Bottom Navigation** → Platform-optimized mobile tabs
- **Breadcrumb Topbar** → Combined header + navigation path
- **View Transition Wrapper** → Smooth page transitions with API
- **Theme Switcher** → Light/dark mode toggle with persistence

**Layout System:**
- **Collapsible Sidebar** → Responsive desktop sidebar with mobile adaptation
- **Mobile Bottom Tabs** → Touch-friendly navigation for small screens
- **Breadcrumb Topbar** → Contextual navigation path + action buttons
- **Split-Screen Auth** → Asymmetric layout for authentication pages

**Dependencies:**
- `class-variance-authority` → CVA for component variants
- `clsx` + `tailwind-merge` → Utility class merging
- `lucide-react` → Icon library
- `23 Tests (base)` + `18 Tests (composites)` → Component rendering, variants, accessibility

### `@creator-studio/canvas`
**Path:** `packages/canvas`
**Type:** Tldraw 4.3.1 integration with custom extensions
**Exports:**
- `./editor` → Canvas editor component
- `./shapes` → Custom shape utilities
- `./templates` → Design templates

**Enhanced Capabilities:**
- **3 Custom Shapes** → QuoteCard, CarouselSlide, TextOverlay
- **7 Templates** → Pre-built canvas designs
- **Persistence** → Save/load canvas state
- **Toolbar** → Enhanced editing controls
- **20 Tests** → Shape rendering, template loading, persistence

**Key Files:**
- `src/editor.tsx` → Main canvas editor
- `src/shapes/` → Custom shape implementations
- `src/templates/` → Template definitions
- `src/*.test.ts` → 20 comprehensive tests

**Dependencies:**
- `tldraw` → Vector drawing engine (pinned v4.3.1)
- Lazy-loaded in React Router for SSR compatibility

### `@creator-studio/video`
**Path:** `packages/video`
**Type:** Remotion composition and timeline management
**Exports:**
- `./compositions` → Video composition components
- `./timeline` → Timeline editor
- `./clips` → Clip management

**Enhanced Capabilities:**
- **3 Compositions** → Text overlay, transitions, effects
- **Clip Management** → Drag/resize clips on timeline
- **Audio Support** → Background music and voiceover
- **Persistence** → Save/load video projects
- **23 Tests** → Composition rendering, timeline operations, export

**Key Files:**
- `src/compositions/` → Remotion composition components
- `src/timeline/` → Timeline editor logic
- `src/clip-manager.ts` → Clip manipulation utilities
- `src/*.test.ts` → 23 comprehensive tests

**Dependencies:**
- `remotion` → Video rendering engine
- `@remotion/player` → Video preview player
- Lazy-loaded for client-side only rendering

### `@creator-studio/crawler`
**Path:** `packages/crawler`
**Type:** Web scraping and data extraction engine
**Exports:**
- `./scraper` → HTML scraping utilities
- `./jobs` → Job queue management
- `./exporters` → Data export formats

**Enhanced Capabilities:**
- **Request Queue** → Rate-limited HTTP requests
- **Rate Limiter** → Configurable request throttling
- **Retry Handler** → Automatic failure recovery
- **Session Manager** → Cookie and session persistence
- **Data Exporter** → JSON, CSV, XML output formats
- **Depth Crawler** → Multi-level site traversal
- **57 Tests** → Queue operations, rate limiting, data export

**Key Files:**
- `src/request-queue.ts` → HTTP request management
- `src/rate-limiter.ts` → Request throttling
- `src/retry-handler.ts` → Failure recovery logic
- `src/session-manager.ts` → Session persistence
- `src/exporters/` → Data format exporters
- `src/*.test.ts` → 57 comprehensive tests

**Dependencies:**
- `cheerio` → HTML parsing
- `fetch` → HTTP requests (serverless-compatible)

### `@creator-studio/social`
**Path:** `packages/social`
**Type:** Social media client abstraction with 7 platform support
**Exports:**
- `./clients` → Platform-specific client implementations
- `./composer` → Unified post composer
- `./uploader` → Media upload handler
- `./types` → Platform-specific type definitions
- `./lib` → Helper utilities and API abstractions

**Supported Platforms (7 total):**
- **Twitter/X** → API v2 integration
- **LinkedIn** → Professional network posting
- **Bluesky** → AT Protocol with app passwords
- **Instagram** → Meta Graph API v22.0
- **Facebook** → Meta Graph API (pages, photo/video/text posts)
- **Threads** → Container-based publishing workflow
- **TikTok** → Content Posting API with chunked upload

**Enhanced Capabilities:**
- **Unified Interface** → All platforms implement `SocialPlatformClient`
- **Meta Platform Abstraction** → Shared `meta-api-helpers.ts` for IG/FB/Threads
- **OAuth Integration** → Meta OAuth (FB/IG/Threads) + TikTok OAuth flows
- **Platform Factory** → Dynamic client instantiation with token decryption
- **Token Encryption** → AES-256-GCM before database storage
- **Media Upload** → Chunked upload for TikTok, standard upload for others
- **Social Analytics** → View insights, follower trends
- **Post Scheduling** → Future publish capability for all platforms
- **70+ Tests** → Comprehensive client operations and media handling

**Key Files:**
- `src/types/` → Platform-specific types (facebook-types, threads-types, tiktok-types, etc.)
- `src/lib/facebook-client.ts` → Facebook Graph API wrapper
- `src/lib/threads-client.ts` → Threads container-based publisher
- `src/lib/instagram-client.ts` → Instagram Graph API client
- `src/lib/tiktok-client.ts` → TikTok Content Posting API
- `src/lib/twitter-client.ts` → Twitter/X API v2 client
- `src/lib/linkedin-client.ts` → LinkedIn API integration
- `src/lib/bluesky-client.ts` → Bluesky AT Protocol client
- `src/lib/meta-api-helpers.ts` → Shared Meta platform utilities
- `src/lib/media-upload-handler.ts` → Chunked/standard upload logic
- `src/platform-factory.ts` → Client factory (token decryption + instantiation)
- `src/*.test.ts` → 70+ comprehensive tests

**Dependencies:**
- `twitter-api-v2` → Twitter/X API client
- `linkedin-api` → LinkedIn API integration
- `crypto` (Node.js) → AES-256-GCM token encryption
- AT Protocol (native fetch) → Bluesky integration
- Meta Graph API (native fetch) → Instagram, Facebook, Threads

### `@creator-studio/ai`
**Path:** `packages/ai`
**Type:** AI agent framework with Vercel AI SDK
**Exports:**
- `./agents` → Agent implementations
- `./tools` → Tool definitions
- `./sessions` → Session management

**Enhanced Capabilities:**
- **Structured Output** → Type-safe AI responses with Zod validation
- **Multi-step Agent** → Sequential reasoning and planning
- **Session Persistence** → Save/load agent conversation state
- **Content Templates** → Prompt templates for common tasks
- **Token Tracker** → Monitor API usage and costs
- **31 Tests** → Agent execution, tool calls, session management

**Key Files:**
- `src/agents/` → AI agent implementations
- `src/tools/` → Tool function definitions
- `src/session-manager.ts` → Conversation persistence
- `src/token-tracker.ts` → Usage monitoring
- `src/templates/` → Prompt templates
- `src/*.test.ts` → 31 comprehensive tests

**Dependencies:**
- `ai` + `@ai-sdk/openai` → Vercel AI SDK and OpenAI provider
- `zod` → Schema validation for structured outputs
- In-memory session storage (swappable to Redis)

### `@creator-studio/webhooks`
**Path:** `packages/webhooks`
**Type:** Event-driven HTTP callbacks with HMAC signing
**Exports:**
- `./webhook-signer` → HMAC-SHA256 signing/verification
- `./webhook-manager` → Event delivery system
- `./webhook-retry-scheduler` → Automatic retry with exponential backoff

**Features:**
- HMAC-SHA256 payload signing for security
- Event trigger system (`post.created`, `export.completed`, `crawler.finished`)
- Retry scheduler with exponential backoff (3 attempts max)
- HTTPS-only URL enforcement
- Signature header: `X-Webhook-Signature`

**Key Files:**
- `src/webhook-signer.ts` → Crypto signing utilities
- `src/webhook-manager.ts` → Delivery logic
- `src/webhook-retry-scheduler.ts` → Background retry job

**Dependencies:**
- `node:crypto` → HMAC signing
- Database storage for webhook subscriptions and delivery logs

### `@creator-studio/redis`
**Path:** `packages/redis`
**Type:** Distributed caching layer with in-memory fallback
**Exports:**
- `./client` → Redis client instance
- `./cache-helpers` → get, set, del, ttl utilities
- `./rate-limiter` → Token bucket rate limiting

**Features:**
- Upstash Redis for production deployments
- In-memory fallback for MVP/offline compatibility
- TTL support with automatic key expiration
- Rate limiting: 10K+ concurrent connections
- Session storage for distributed systems

**Key Files:**
- `src/client.ts` → Redis/fallback client
- `src/cache-helpers.ts` → Cache operations
- `src/rate-limiter.ts` → Token bucket algorithm

**Dependencies:**
- `@upstash/redis` → Serverless Redis client
- Fallback uses Node.js Map with expiration timers

### `@creator-studio/storage`
**Path:** `packages/storage`
**Type:** Cloud media storage with direct upload support
**Exports:**
- `./client` → Storage client instance
- `./upload-handler` → Presigned URL generation
- `./download-handler` → File retrieval

**Features:**
- Cloudflare R2 for production deployments
- In-memory file system for MVP/testing
- Presigned URLs for direct client uploads (1-hour expiry)
- Multi-part upload for large files (>5MB)
- Public URL generation with CDN caching

**Key Files:**
- `src/client.ts` → S3/fallback storage client
- `src/upload-handler.ts` → Presigned URL logic
- `src/download-handler.ts` → File retrieval

**Dependencies:**
- `@aws-sdk/client-s3` → S3/R2 compatible API
- Fallback uses Node.js file system (ephemeral on serverless)

### `@creator-studio/sdk`
**Path:** `packages/sdk`
**Type:** Type-safe OpenAPI client for external integrations
**Exports:**
- `./client` → openapi-fetch based HTTP client
- `./schemas` → Generated TypeScript types from OpenAPI spec

**Features:**
- Auto-generated from OpenAPI 3.1 spec
- Type-safe API calls with Zod schema validation
- Supports all REST API endpoints (v1)
- Can be published to npm for third-party use
- Example: `const { data } = await client.GET('/api/v1/posts')`

**Key Files:**
- `src/client.ts` → openapi-fetch wrapper
- `src/schemas.ts` → Generated from OpenAPI spec
- `README.md` → Usage documentation

**Dependencies:**
- `openapi-fetch` → Lightweight OpenAPI client
- `zod` → Schema validation (re-exported)

### Plugin System & Marketplace (apps/web)
**Path:** `apps/web/app/routes/api.v1.plugins.ts`
**Type:** Plugin registry, installation, and sandboxed execution
**Features:**
- Plugin manifest schema with Zod validation
- Web Worker sandbox for isolated execution
- Event hook system (7 hook types)
- Plugin approval workflow (status: pending|approved|rejected)
- Dashboard UI for marketplace and management

**Plugin Manifest Schema:**
```typescript
{
  name: string               // Unique plugin identifier
  version: string            // semver format
  displayName: string        // User-friendly name
  description: string        // Long description
  author: string             // Plugin creator
  hooks: string[]            // Supported hooks
  permissions: string[]      // Required permissions
  config?: Record            // Plugin configuration schema
}
```

**Event Hooks (7 types):**
- `post.creating` → Before social post created
- `post.created` → After post published
- `post.scheduled` → When post scheduled
- `crawler.finished` → After crawler completes
- `export.completed` → After data export
- `platform.connected` → After OAuth success
- `plugin.installed` → After plugin install

**API Endpoints:**
- `GET /api/v1/plugins` → List marketplace plugins
- `POST /api/v1/plugins/:id/install` → Install plugin
- `DELETE /api/v1/plugins/:id/uninstall` → Remove plugin
- `PATCH /api/v1/plugins/:id/approve` → Admin approval

**Dashboard Routes:**
- `/dashboard/plugins/marketplace` → Browse available plugins
- `/dashboard/plugins/installed` → Manage installed plugins

**Key Files:**
- `routes/api.v1.plugins.ts` → Registry and CRUD operations
- `lib/plugin-manifest.ts` → Zod validation schema
- `lib/plugin-sandbox.ts` → Web Worker executor
- `components/plugin-marketplace.tsx` → Plugin browser UI
- `components/plugin-manager.tsx` → Installation manager

**Security:**
- Web Worker isolation prevents malicious code execution
- Message-passing architecture for safe communication
- Manifest validation before installation
- Admin approval workflow for public plugins

### OAuth Flows (apps/web)
**Supported OAuth Integrations:**
1. **Meta OAuth** (Facebook/Instagram/Threads) — Single unified flow
   - Route: `GET /api/oauth/meta/authorize` → Redirect to Meta Login
   - Route: `POST /api/oauth/meta/callback` → Token exchange + storage
   - Discovers connected pages, accounts, and profiles
   - Platform picker dialog for user selection
   - Token encryption before database storage

2. **TikTok OAuth** — Separate flow with CSRF protection
   - Route: `GET /api/oauth/tiktok/authorize` → Redirect to TikTok Login
   - Route: `POST /api/oauth/tiktok/callback` → CSRF validation + token exchange
   - Scope: `user.info.basic` (extensible for user_video.read, etc.)

**Key Files:**
- `routes/api.oauth.meta.authorize.ts` → Meta login redirect
- `routes/api.oauth.meta.callback.ts` → Meta token exchange
- `routes/api.oauth.tiktok.authorize.ts` → TikTok login redirect
- `routes/api.oauth.tiktok.callback.ts` → TikTok token exchange
- `lib/oauth-utils.ts` → CSRF, state validation, encryption

**Token Security:**
- AES-256-GCM encryption for sensitive tokens
- State parameter validation (CSRF protection)
- Secure random key generation
- Automatic token refresh on expiration

### Zapier Integration
**Path:** `zapier/`
**Type:** No-code automation platform integration
**Structure:**
- `authentication.js` → Bearer token auth (API keys)
- `triggers/` → 2 polling triggers
  - `post-created.js` → New social posts (polls `/v1/zapier/posts/recent`)
  - `export-completed.js` → Completed exports (polls `/v1/zapier/exports/recent`)
- `creates/` → 2 actions
  - `create-post.js` → Create social post via `POST /v1/posts`
  - `upload-image.js` → Upload image stub

**Deployment:**
- Install: `npm install -g zapier-platform-cli`
- Push: `zapier push`
- Test: `zapier test`

**API Requirements:**
- `GET /api/v1/auth/verify` → Key validation
- `GET /api/v1/zapier/posts/recent` → Recent posts (15 min window)
- `GET /api/v1/zapier/exports/recent` → Recent exports (15 min window)
- `POST /api/v1/posts` → Create post with scheduling

## Testing Summary

**Total Tests:** 400+ across 40+ test files
- DB: 34 tests
- Auth: 17 tests
- UI (base + composites): 41 tests (17 base + 24 composites)
- Canvas: 20 tests
- Video: 23 tests
- Crawler: 57 tests
- Social: 70+ tests (expanded for 7 platforms + OAuth)
- AI: 31 tests
- SDK: 8+ tests (client generation, request validation)
- Plugins: 12+ tests (manifest validation, sandbox, registry)
- Redis: 18+ tests (cache operations, rate limiting, fallback)
- Storage: 15+ tests (uploads, presigned URLs, fallback)

**Phase 5b Test Coverage:**
- [x] Facebook/Instagram/Threads clients (Meta API integration)
- [x] TikTok client (Content Posting API)
- [x] Meta OAuth flow (token exchange, encryption)
- [x] TikTok OAuth flow (CSRF protection)
- [x] Plugin manifest validation
- [x] Plugin sandbox isolation
- [x] Plugin registry API (CRUD operations)
- [x] OpenAPI spec generation

**Test Infrastructure:**
- Framework: Vitest 3.2.1
- Command: `pnpm test` (runs all packages)
- Per-package: `pnpm test --filter @creator-studio/{package}`

## Environment Variables

**Required:**
- `DATABASE_URL` → PostgreSQL connection string (Supabase)
- `BETTER_AUTH_URL` → Application URL (http://localhost:5173 in dev)
- `BETTER_AUTH_SECRET` → Random secret (min 32 chars)

**Phase 5b - OAuth & Social Integration:**
- `META_OAUTH_CLIENT_ID` → Facebook/Instagram/Threads app ID
- `META_OAUTH_CLIENT_SECRET` → Meta OAuth client secret
- `TIKTOK_OAUTH_CLIENT_ID` → TikTok client key
- `TIKTOK_OAUTH_CLIENT_SECRET` → TikTok client secret
- `TWITTER_OAUTH_CLIENT_ID` → Twitter API client ID
- `TWITTER_OAUTH_CLIENT_SECRET` → Twitter API secret
- `LINKEDIN_OAUTH_CLIENT_ID` → LinkedIn app ID
- `LINKEDIN_OAUTH_CLIENT_SECRET` → LinkedIn secret

**Optional:**
- `GOOGLE_CLIENT_ID` → Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` → Google OAuth secret
- `CLOUDINARY_CLOUD_NAME` → Cloudinary config
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENTRY_DSN` → Sentry error tracking
- `INNGEST_EVENT_KEY` → Inngest scheduling
- `INNGEST_SIGNING_KEY`
- `OPENAI_API_KEY` → OpenAI API key (for AI features)

## Development Workflow

### Install Dependencies
```bash
pnpm install
```

### Development
```bash
pnpm dev              # Start all apps in dev mode
pnpm dev --filter web # Start only web app
```

### Build
```bash
pnpm build            # Build all packages
pnpm build --filter web
```

### Database
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to DB (no migrations)
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test --filter web
```

### Linting & Formatting
```bash
pnpm lint             # Lint all packages
pnpm format           # Format all files
pnpm format:check     # Check formatting
pnpm typecheck        # TypeScript type checking
```

## Turborepo Pipeline

**Build Pipeline:**
- Builds depend on upstream builds (`^build`)
- Outputs cached in `build/`, `dist/`
- Environment variables included in cache key

**Dev Mode:**
- No caching (cache: false)
- Persistent processes

**Test Pipeline:**
- Depends on build completion
- No caching for database operations

## Import Conventions

### Workspace Packages
```typescript
import { prisma } from '@creator-studio/db/client'
import { auth } from '@creator-studio/auth/server'
import { Button } from '@creator-studio/ui/components/button'
import '@creator-studio/ui/globals.css'
```

### React Router Imports
```typescript
import type { Route } from './+types/home'  // Route types
import { useLoaderData } from 'react-router' // Hooks
```

## File Naming Conventions

- **Routes:** `kebab-case.tsx` (e.g., `sign-in.tsx`, `dashboard.tsx`)
- **Components:** `kebab-case.tsx` (e.g., `user-avatar.tsx`, `nav-bar.tsx`)
- **Utilities:** `kebab-case.ts` (e.g., `auth-server.ts`, `db-client.ts`)
- **Types:** `kebab-case.ts` or co-located in component files
- **Styles:** `kebab-case.css`

## Code Quality

### ESLint Configuration
- Parser: `@typescript-eslint/parser`
- Plugins: TypeScript ESLint, React, React Hooks
- Rules: Warn on unused vars, warn on explicit any

### Prettier Configuration
- No semicolons
- Single quotes
- Trailing commas
- 2-space indentation
- 100-character line width
- Tailwind class sorting

### TypeScript
- Strict mode enabled
- ECMAScript latest features
- Module: ESNext
- Target: ES2022

## Project Phase Status

### Phase 1: Foundation (COMPLETE)
**Completed:**
- [x] Turborepo monorepo setup
- [x] React Router 7.12 SSR application
- [x] Tailwind CSS 4 + shadcn/ui integration
- [x] Prisma 6.16.3 + PostgreSQL schema
- [x] Better Auth 1.4.18 (email/password + Google OAuth)
- [x] File-based routing structure
- [x] Workspace package configuration
- [x] Development tooling (ESLint, Prettier, Vitest)
- [x] Basic authentication routes (sign-in, sign-up)
- [x] Dashboard layout with placeholder routes

### Phase 2: Package Deep Enhancement (COMPLETE)
**Completed:**
- [x] Database: Enhanced queries (pagination, bulk ops, full-text search, soft delete, analytics), seed script, 34 tests
- [x] Authentication: Better Auth plugins (2FA, magic link, organization), middleware helpers, 17 tests
- [x] UI Components: 10 shadcn-style components (Alert, Avatar, Badge, Card, Dialog, Dropdown, Input, Select, Tabs, Tooltip), 17 tests
- [x] Canvas Editor: 3 custom Tldraw shapes, 7 templates, persistence, toolbar, 20 tests
- [x] Video Editor: 3 compositions (text overlay, transitions), clip drag/resize, audio support, persistence, 23 tests
- [x] Web Crawler: Request queue, rate limiter, retry handler, session manager, data exporter, depth crawler, 57 tests
- [x] Social Management: Platform interface, Twitter/LinkedIn clients, unified composer, media upload, 47 tests
- [x] AI Tools: Structured output, multi-step agent, session persistence, content templates, token tracker, 31 tests
- [x] Test Coverage: 246 tests across 31 test files

**Available Packages:**
- `@creator-studio/web` → Main SSR application
- `@creator-studio/db` → Database + advanced queries
- `@creator-studio/auth` → Authentication + plugins
- `@creator-studio/ui` → Reusable UI components
- `@creator-studio/canvas` → Tldraw editor integration
- `@creator-studio/video` → Remotion compositions
- `@creator-studio/crawler` → Web scraping engine
- `@creator-studio/social` → Social media clients (Twitter, LinkedIn, Bluesky)
- `@creator-studio/ai` → AI agent framework
- `@creator-studio/webhooks` → Event delivery system

**External Integrations:**
- `zapier/` → Zapier platform integration (triggers + actions)

### Phase 5a: Ecosystem & Integrations (COMPLETE)
**Completed:**
- [x] Webhooks package with HMAC-SHA256 signing, retry scheduler
- [x] REST API v1 endpoints (auth, posts, Zapier triggers)
- [x] API key authentication (SHA-256 hashing, scope-based permissions)
- [x] Rate limiting (token bucket, 100 req/min default)
- [x] Zapier integration (2 triggers, 2 actions)
- [x] Bluesky/AT Protocol client (app password auth, image uploads)
- [x] Dashboard pages (API keys, webhooks, plugins/integrations)
- [x] Security: HTTPS-only webhooks, timing-safe comparisons, scope enforcement

### Phase 5b: Extended Ecosystem (COMPLETE)
**Completed:**
- [x] Plugin system with Web Worker sandbox isolation
- [x] Plugin marketplace with approval workflow
- [x] 4 new social platform integrations (Instagram, TikTok, Facebook, Threads)
- [x] OpenAPI 3.1 spec generation from Zod schemas
- [x] SDK package with openapi-fetch client
- [x] Unified OAuth flows for Meta platforms (FB/IG/Threads)
- [x] Token encryption (AES-256-GCM before storage)
- [x] Event hook system (7 hook types)

### Phase 6: Advanced Features (COMPLETE)
**Completed:**
- [x] Redis integration (packages/redis) — Upstash + in-memory fallback
- [x] Inngest job queue — Async social, webhook, crawler, export jobs
- [x] R2 media storage (packages/storage) — Cloudflare + presigned URLs
- [x] Remotion Lambda video export — Server-side rendering with progress tracking
- [x] Browserless crawler — Cheerio-first + JavaScript rendering fallback
- [x] Advanced AI features — Image generation, hashtag suggestions, performance prediction
- [x] Vercel + Docker deployment — Production-ready containerization
- [x] DevOps CI/CD — GitHub Actions, Sentry, Pino logging, CSP/CORS headers

**Next Steps:**
- Phase 7: Advanced analytics dashboard
- Phase 8: Global scalability and multi-region support
