# Project Changelog

All notable changes to Creator Studio are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-02-14

### Added - UI/UX Design System Implementation

**Design System Foundation (8-Phase Implementation)**
- Complete CSS custom property system for design tokens
- Tailwind CSS 4 `@theme` directive integration
- Brand color establishment: Teal/Cyan (#0891B2)
- 23 base shadcn/ui-style components (vs. 10 previously)
- 6 new composite components for layout patterns
- Full light/dark mode support with theme persistence

**Component Expansion**
- New base components: Breadcrumb, Sidebar, Button variants, Checkbox, Radio, Slider, Switch, Textarea, Label, Separator, Spinner, Skeleton
- Composite components:
  - Split-Screen Auth (two-column asymmetric layout)
  - Collapsible Sidebar (responsive desktop navigation)
  - Mobile Bottom Tabs (iOS-style touch navigation)
  - Breadcrumb Topbar (contextual header navigation)
  - View Transition Wrapper (smooth page transitions)
  - Theme Switcher (light/dark mode toggle)

**Layout System**
- Responsive collapsible sidebar for desktop (with expand/collapse animation)
- Mobile-optimized bottom navigation tabs
- Breadcrumb navigation topbar for contextual awareness
- Split-screen authentication pages with asymmetric layout
- Automatic responsive stacking on small screens

**Theme Architecture**
- ThemeProvider context for centralized theme management
- CSS variables for design tokens (colors, spacing, typography, radius)
- localStorage persistence for user theme preference
- SSR hydration script to prevent flash of unstyled content (FOUC)
- Smooth view transitions when switching themes

**Accessibility Improvements**
- Full keyboard navigation support
- Screen reader optimizations
- ARIA labels on all interactive components
- Proper semantic HTML structure
- Color contrast compliance (WCAG AA+)
- Focus indicators and visual feedback

**Code Standards Updates**
- Design token usage guidelines (use TW4 utilities, not inline hsl())
- Composite component structure documentation
- Theme integration patterns
- Design system best practices

**Test Coverage**
- 24 new tests for composite components
- 41 total UI package tests (up from 17)
- Full variant testing for all components
- Responsive design testing
- Theme switching verification

**Documentation**
- Design system architecture overview
- Component library reference
- Theme integration guide
- Layout system documentation
- Brand guidelines and color palette
- Typography system documentation

### Breaking Changes
- Components now use design tokens (bg-primary, text-muted-foreground) instead of hardcoded colors
- Must wrap app with ThemeProvider for theme support
- Composite components replace multiple manual layout patterns

### Technical Details
- **Design Tokens**: CSS custom properties mapped to Tailwind 4 utilities
- **CVA Integration**: Component variants use class-variance-authority with token-based styling
- **Performance**: Optimized CSS output via Tailwind 4 `@theme` compilation
- **SSR Safety**: Theme hydration prevents layout shift on initial load

---

## [0.5.0] - 2026-02-14

### Added - Phase 5a: Ecosystem & Integrations (commit 6fc3d5c)

**Webhook System**
- Outgoing webhook delivery with HMAC-SHA256 signing
- `WebhookEndpoint` and `WebhookEvent` Prisma models
- Exponential backoff retry logic (3 attempts)
- Dashboard UI at `/dashboard/webhooks` for webhook management
- Webhook event logs and failure tracking
- `@creator-studio/webhooks` package

**REST API v1**
- `/api/v1/posts` endpoint for post management
- `/api/v1/users/me` endpoint for user profile
- `/api/v1/zapier/posts/recent` and `/api/v1/zapier/exports/recent` polling endpoints
- API key generation and management
- API key authentication middleware with rate limiting (10 req/min per key)
- Dashboard UI at `/dashboard/api-keys` for API key management
- `ApiKey` Prisma model with hashed keys

**Social Platform Integration**
- Bluesky AT Protocol client implementation
- Session authentication for Bluesky
- Post creation with text and media upload support
- Updated `platform-factory.ts` to support Bluesky
- Social platform connection UI at `/api/social/connect`

**Zapier Integration**
- Zapier CLI setup with `zapier/` directory
- 2 triggers: `post.created`, `export.completed`
- Polling-based trigger implementation
- API key authentication for Zapier

**Dashboard UI**
- `/dashboard/webhooks` page for webhook endpoint management
- `/dashboard/api-keys` page for API key CRUD operations
- `/dashboard/plugins` page placeholder (deferred to Phase 5b)
- Updated sidebar navigation with new routes

**Database Schema**
- `WebhookEndpoint` table (url, secret, events, active, metadata)
- `WebhookEvent` table (endpoint, eventType, payload, status, attempts)
- `ApiKey` table (name, keyHash, lastUsed, expiresAt, scopes)

### Deferred
- Plugin system (moved to Phase 5b)
- Tests for webhook, API, and Zapier features
- Instagram Graph API integration (moved to Phase 5b)

### Technical Details
- **Webhook Security**: HMAC-SHA256 signature validation
- **Rate Limiting**: Token bucket algorithm (10 req/min per API key)
- **API Key Storage**: bcrypt hashing for key security
- **Error Handling**: Graceful degradation for missing Bluesky credentials

---

## [0.4.0] - 2025-Q3

### Added - Phase 4: MVP Enterprise (commit 99bd731)

**Organizations**
- Organization CRUD API (create, update, delete, member management)
- Organization switcher in sidebar
- Organization dashboard UI with tabs (overview, members, settings)
- Member invitation system with role assignment

**RBAC (Role-Based Access Control)**
- Role hierarchy: owner → admin → member → viewer
- Permission matrix for all resources
- `requireOrganizationRole` middleware
- Privilege escalation fixes with transaction safety

**Security**
- Input validation and sanitization
- Secure session management
- Transaction-based role updates

**Tests**
- 55 tests passing (38 RBAC + 13 auth + 4 config)

---

## [0.3.0] - 2025-Q2

### Added - Phase 3: Optimization & Performance (commit 1360a5e)

**Performance**
- Caching layer with Redis for sessions
- Database query optimization with indexes
- Code splitting and lazy loading
- CDN integration for static assets
- Database read replicas (Supabase multi-region)

**Monitoring**
- Sentry integration for error tracking
- Vercel Analytics for performance monitoring
- API response compression
- Pagination optimization

**Success Metrics Achieved**
- First Contentful Paint < 2s
- Database query time < 200ms (p95)
- 90+ Lighthouse scores
- Memory usage < 512MB on serverless
- Cost reduction 20-30%

---

## [0.2.0] - 2025-Q1

### Added - Phase 2: Package Deep Enhancement (commit be05b34)

**Database Package (@creator-studio/db)**
- Advanced query helpers (pagination, bulk operations, full-text search)
- Database seed script for test data
- 34 comprehensive tests

**Authentication Package (@creator-studio/auth)**
- Better Auth plugins: 2FA, Magic link, Organization support
- Middleware helpers: requireAuth, requireRole, requireOrganizationRole
- 17 comprehensive tests

**UI Components Package (@creator-studio/ui)**
- 10 shadcn-style components (Alert, Avatar, Badge, Card, Dialog, Dropdown, Input, Select, Tabs, Tooltip)
- 17 comprehensive tests
- Consistent Tailwind styling

**Canvas Package (@creator-studio/canvas)**
- Tldraw 4.3.1 integration
- 3 custom shapes (QuoteCard, CarouselSlide, TextOverlay)
- 7 design templates
- Canvas state persistence
- 20 comprehensive tests

**Video Package (@creator-studio/video)**
- Remotion composition framework
- 3 composition templates
- Timeline editor with clip management
- Audio track support
- 23 comprehensive tests

**Crawler Package (@creator-studio/crawler)**
- Request queue with rate limiting
- Automatic retry handler
- Session manager
- Data exporters (JSON, CSV, XML)
- 57 comprehensive tests

**Social Package (@creator-studio/social)**
- Platform interface (unified API)
- Twitter/X and LinkedIn clients
- Platform factory pattern
- 47 comprehensive tests

**AI Package (@creator-studio/ai)**
- Vercel AI SDK integration (OpenAI)
- Structured output with Zod validation
- Multi-step agent execution
- Tool calling support
- 31 comprehensive tests

**Test Coverage**
- 246 total tests across 31 test files
- 100% pass rate

---

## [0.1.0] - 2024-Q4

### Added - Phase 1: Foundation

**Infrastructure**
- Turborepo monorepo setup
- React Router 7.12 SSR application
- Tailwind CSS 4 + shadcn/ui integration
- Prisma 6.16.3 + PostgreSQL database
- Better Auth 1.4.18 authentication
- File-based routing with dashboard layout
- 8 workspace packages

**Authentication**
- Email/password authentication
- Google OAuth integration
- Session management

**Development Tooling**
- ESLint and Prettier configuration
- Vitest testing framework
- TypeScript strict mode
- CI/CD pipeline

---

## Version History

| Version | Phase | Date | Status |
|---------|-------|------|--------|
| 0.6.0 | UI/UX Design System | 2026-02-14 | Current |
| 0.5.0 | Phase 5a: Ecosystem | 2026-02-14 | Released |
| 0.4.0 | Phase 4: Enterprise | 2025-Q3 | Released |
| 0.3.0 | Phase 3: Performance | 2025-Q2 | Released |
| 0.2.0 | Phase 2: Packages | 2025-Q1 | Released |
| 0.1.0 | Phase 1: Foundation | 2024-Q4 | Released |

---

## Semantic Versioning

- **Major (X.0.0)**: Breaking changes, major architecture shifts
- **Minor (0.X.0)**: New features, phase completions, backward-compatible additions
- **Patch (0.0.X)**: Bug fixes, documentation updates, minor improvements

---

## Links

- [Project Roadmap](./project-roadmap.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
