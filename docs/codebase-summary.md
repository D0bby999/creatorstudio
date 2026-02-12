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
- `/api/auth/*` → `routes/api.auth.$.ts` (Better Auth handler)

**Key Files:**
- `app/root.tsx` → Root layout with HTML structure
- `app/routes.ts` → Route configuration
- `app/lib/auth-server.ts` → Server-side auth utilities
- `app/lib/auth-client.ts` → Client-side auth hooks

### `@creator-studio/db`
**Path:** `packages/db`
**Exports:**
- `.` → `src/index.ts` (schema exports)
- `./client` → `src/client.ts` (Prisma client instance)

**Database Schema:**
- **User** → Core user model (id, name, email, emailVerified, image)
- **Session** → Better Auth sessions (token, expiresAt, ipAddress, userAgent)
- **Account** → OAuth providers + password storage (providerId, accessToken, refreshToken)
- **Verification** → Email/phone verification tokens
- **Project** → User-created projects (type: canvas | video, data: JSON)

**Scripts:**
- `db:generate` → Generate Prisma client
- `db:push` → Push schema to database
- `db:migrate` → Run migrations
- `db:studio` → Open Prisma Studio

### `@creator-studio/auth`
**Path:** `packages/auth`
**Exports:**
- `.` → `src/index.ts`
- `./server` → `src/auth-server.ts`
- `./client` → `src/auth-client.ts`

**Configuration:**
- **Base Path:** `/api/auth`
- **Providers:** Email/password, Google OAuth
- **Session:** Cookie-based with 5-minute cache
- **Adapter:** Prisma adapter for PostgreSQL

### `@creator-studio/ui`
**Path:** `packages/ui`
**Exports:**
- `./globals.css` → Tailwind base styles
- `./lib/*` → Utility functions (cn, etc.)
- `./components/*` → shadcn/ui components

**Dependencies:**
- `class-variance-authority` → CVA for component variants
- `clsx` + `tailwind-merge` → Utility class merging
- `lucide-react` → Icon library

## Environment Variables

**Required:**
- `DATABASE_URL` → PostgreSQL connection string (Supabase)
- `BETTER_AUTH_URL` → Application URL (http://localhost:5173 in dev)
- `BETTER_AUTH_SECRET` → Random secret (min 32 chars)

**Optional:**
- `GOOGLE_CLIENT_ID` → Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` → Google OAuth secret
- `CLOUDINARY_CLOUD_NAME` → Cloudinary config
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENTRY_DSN` → Sentry error tracking
- `INNGEST_EVENT_KEY` → Inngest scheduling
- `INNGEST_SIGNING_KEY`

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

## Phase 1 Foundation Status

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

**Next Steps:**
- Implement canvas editor with Tldraw
- Implement video editor with Remotion
- Implement crawler with web scraping tools
- Implement social management integrations
- Implement AI tools with Vercel AI SDK
