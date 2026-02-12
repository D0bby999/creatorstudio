# System Architecture

## Overview

Creator Studio is built as a **Turborepo monorepo** with a **React Router 7 SSR application** and shared workspace packages. The architecture prioritizes modularity, type safety, and developer productivity.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                     │
├─────────────────────────────────────────────────────────────┤
│  React 18 + React Router 7                                  │
│  ├─ SSR Routes (hydrated on client)                         │
│  ├─ Client-side navigation                                  │
│  └─ Better Auth client hooks                                │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js 20+)                     │
├─────────────────────────────────────────────────────────────┤
│  React Router 7 SSR Server (@react-router/node)             │
│  ├─ Route loaders (server-side data fetching)               │
│  ├─ Route actions (form submissions, mutations)             │
│  ├─ Better Auth API (/api/auth/*)                           │
│  └─ Session management                                       │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE (PostgreSQL/Supabase)               │
├─────────────────────────────────────────────────────────────┤
│  Tables: user, session, account, verification, project      │
│  ├─ User authentication data                                │
│  ├─ OAuth provider tokens                                   │
│  └─ Application data (projects, etc.)                       │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

### Turborepo Configuration

```json
{
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] }
  }
}
```

**Pipeline Execution:**
1. `pnpm dev` → Starts all apps in parallel (no caching)
2. `pnpm build` → Builds packages first, then apps (cached)
3. `pnpm test` → Runs tests after build completes

### Package Dependency Graph

```
┌──────────────────┐
│  @creator-studio/│
│       web        │  (React Router 7 app)
└────────┬─────────┘
         │
         ├──────────────────────┬──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ @creator-studio│    │ @creator-studio│    │ @creator-studio│
│      ui        │    │      auth      │    │       db       │
└────────────────┘    └────────┬───────┘    └────────────────┘
                               │                      ▲
                               └──────────────────────┘
```

**Dependencies:**
- `web` depends on `ui`, `auth`, `db`
- `auth` depends on `db`
- `ui` has no internal dependencies (peer deps: react, react-dom)
- `db` has no internal dependencies

## Application Layer (apps/web)

### React Router 7 SSR Pipeline

```
1. HTTP Request → Node.js Server
         ▼
2. React Router matches route
         ▼
3. Execute loader (server-side data fetch)
         ▼
4. Render React component to HTML (SSR)
         ▼
5. Send HTML + client bundle to browser
         ▼
6. Hydrate React on client (interactive)
         ▼
7. Client-side navigation (no full page reload)
```

### Route Structure

```
app/routes/
├── home.tsx                  GET /
├── sign-in.tsx              GET /sign-in, POST (action)
├── sign-up.tsx              GET /sign-up, POST (action)
├── api.auth.$.ts            ALL /api/auth/* (Better Auth handler)
└── dashboard/
    ├── layout.tsx           Wrapper for /dashboard/*
    ├── index.tsx            GET /dashboard
    ├── canvas.tsx           GET /dashboard/canvas
    ├── video.tsx            GET /dashboard/video
    ├── crawler.tsx          GET /dashboard/crawler
    ├── social.tsx           GET /dashboard/social
    └── ai.tsx               GET /dashboard/ai
```

### Route Module Lifecycle

```typescript
// Lifecycle flow for protected route

// 1. Loader (Server-side)
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.getSession(request)  // Check auth
  if (!session) throw redirect('/sign-in')        // Guard

  const data = await prisma.project.findMany({
    where: { userId: session.user.id }
  })

  return { projects: data, user: session.user }   // Return data
}

// 2. Component (Rendered on server, hydrated on client)
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.projects.map(...)}</div>
}

// 3. Action (Server-side mutations)
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  // Process form submission
  return { success: true }
}
```

## Authentication Layer (packages/auth)

### Better Auth Configuration

```typescript
// packages/auth/src/auth-server.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  basePath: '/api/auth',
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5 min cache
  },
})
```

### Authentication Flow

#### Email/Password Sign Up
```
1. User submits form → POST /sign-up
         ▼
2. Route action receives formData
         ▼
3. Validate email + password
         ▼
4. Call auth.signUp.email() → Better Auth
         ▼
5. Better Auth creates User + Account records (Prisma)
         ▼
6. Create Session + set cookie
         ▼
7. Redirect to /dashboard
```

#### Google OAuth Sign In
```
1. User clicks "Sign in with Google"
         ▼
2. Redirect to /api/auth/google
         ▼
3. Better Auth redirects to Google OAuth consent
         ▼
4. User approves → Google redirects back with code
         ▼
5. Better Auth exchanges code for tokens
         ▼
6. Better Auth creates/updates User + Account (Prisma)
         ▼
7. Create Session + set cookie
         ▼
8. Redirect to /dashboard
```

#### Session Management
```
Request → Cookie "better-auth.session_token"
         ▼
Server reads cookie → auth.getSession(request)
         ▼
Better Auth checks:
  - Token exists in database?
  - Token not expired?
  - Cookie cache valid? (5 min)
         ▼
Return Session { user, expiresAt, ... } or null
```

## Database Layer (packages/db)

### Prisma Architecture

```
┌────────────────────────────────────────┐
│       Application Code                 │
│  (web/routes, auth/server)             │
└────────────────┬───────────────────────┘
                 │ import { prisma }
                 ▼
┌────────────────────────────────────────┐
│     Prisma Client (@prisma/client)     │
│  Generated from schema.prisma          │
└────────────────┬───────────────────────┘
                 │ Query Engine
                 ▼
┌────────────────────────────────────────┐
│    PostgreSQL Database (Supabase)      │
│  Tables, Indexes, Constraints          │
└────────────────────────────────────────┘
```

### Database Schema (ERD)

```
┌──────────────────┐
│      User        │
│──────────────────│
│ id (PK)          │───┐
│ name             │   │
│ email (unique)   │   │
│ emailVerified    │   │
│ image            │   │
│ createdAt        │   │
│ updatedAt        │   │
└──────────────────┘   │
                       │
         ┌─────────────┼─────────────┬─────────────┐
         │             │             │             │
         ▼             ▼             ▼             ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Session   │  │  Account   │  │  Project   │  │Verification│
│────────────│  │────────────│  │────────────│  │────────────│
│ id (PK)    │  │ id (PK)    │  │ id (PK)    │  │ id (PK)    │
│ userId (FK)│  │ userId (FK)│  │ userId (FK)│  │ identifier │
│ token      │  │ providerId │  │ name       │  │ value      │
│ expiresAt  │  │ accountId  │  │ type       │  │ expiresAt  │
│ ipAddress  │  │ accessToken│  │ data (JSON)│  │ createdAt  │
│ userAgent  │  │refreshToken│  │ thumbnail  │  │ updatedAt  │
│ createdAt  │  │ idToken    │  │ createdAt  │  └────────────┘
│ updatedAt  │  │ scope      │  │ updatedAt  │
└────────────┘  │ password   │  └────────────┘
                │ createdAt  │
                │ updatedAt  │
                └────────────┘
```

### Table Purposes

**User:** Core user identity (created by Better Auth)
**Session:** Active login sessions with tokens
**Account:** OAuth provider credentials + password hashes
**Verification:** Email/phone verification tokens
**Project:** User-created canvas/video projects (app-specific)

## UI Layer (packages/ui)

### Component Architecture

```
@creator-studio/ui/
├── src/
│   ├── components/
│   │   ├── button.tsx          (shadcn/ui Button)
│   │   ├── card.tsx            (shadcn/ui Card)
│   │   ├── input.tsx           (shadcn/ui Input)
│   │   └── ...
│   ├── lib/
│   │   └── utils.ts            (cn function for class merging)
│   └── styles/
│       └── globals.css         (Tailwind base styles)
```

### Tailwind CSS 4 Integration

```
1. Import globals.css in app → Tailwind base styles loaded
         ▼
2. Use shadcn/ui components → Pre-styled with Tailwind
         ▼
3. Use cn() utility → Merge custom classes with component styles
         ▼
4. Vite processes Tailwind → Generate optimized CSS bundle
```

### Component Composition

```typescript
// shadcn/ui component pattern
import { type VariantProps, cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
      },
    },
  }
)

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

## Build & Deployment Pipeline

### Development Flow

```bash
# Start development
pnpm dev

# What happens:
1. Turborepo runs "dev" task for all packages (parallel)
2. packages/db → No dev task (types already generated)
3. packages/auth → No dev task (TypeScript source used directly)
4. packages/ui → No dev task (imported as source)
5. apps/web → react-router dev (Vite dev server on :5173)
         ▼
6. Vite serves app with HMR (Hot Module Replacement)
7. Changes auto-reload in browser
```

### Production Build

```bash
# Build for production
pnpm build

# What happens:
1. Turborepo resolves dependency graph
2. Build packages first (bottom-up):
   - packages/db → prisma generate (create Prisma client)
   - packages/auth → echo 'no build needed' (TypeScript source)
   - packages/ui → echo 'no build needed' (TypeScript source)
3. Build apps:
   - apps/web → react-router build (Vite build)
         ▼
4. Output:
   - apps/web/build/client/ → Static assets (JS, CSS, fonts)
   - apps/web/build/server/ → Node.js SSR server
5. Turborepo caches build artifacts
```

### Deployment (Vercel)

```
1. Git push → Vercel webhook triggered
         ▼
2. Vercel runs: pnpm install
         ▼
3. Vercel runs: pnpm build (Turborepo builds everything)
         ▼
4. Vercel deploys apps/web/build/ to edge network
         ▼
5. SSR server runs on Vercel Serverless Functions
         ▼
6. Static assets served from Vercel CDN
         ▼
7. DATABASE_URL points to Supabase PostgreSQL
```

## Data Flow Examples

### Example 1: User Loads Dashboard

```
1. Browser → GET /dashboard
         ▼
2. React Router matches route → dashboard/index.tsx
         ▼
3. Execute loader function (server-side):
   - auth.getSession(request)           → Check authentication
   - prisma.project.findMany(...)       → Fetch user's projects
   - return { projects, user }          → Return data
         ▼
4. Render Dashboard component to HTML (SSR)
         ▼
5. Send HTML + JSON data + client bundle to browser
         ▼
6. React hydrates on client (interactive)
         ▼
7. User navigates to /dashboard/canvas (client-side):
   - React Router loads new route (no server request)
   - Execute loader if needed (fetch API)
   - Update UI without page reload
```

### Example 2: User Creates Project

```
1. User fills form, clicks "Create Project"
         ▼
2. Form submission → POST /dashboard (action)
         ▼
3. Server receives formData:
   - name: "My Canvas Project"
   - type: "canvas"
         ▼
4. Route action function:
   - Validate input
   - Get user session
   - await prisma.project.create({
       data: { name, type, userId }
     })
   - return { success: true, projectId }
         ▼
5. React Router revalidates loaders (refetch projects)
         ▼
6. UI updates with new project in list
```

### Example 3: Google OAuth Login

```
1. User clicks "Sign in with Google" button
         ▼
2. Link → GET /api/auth/google
         ▼
3. Better Auth redirects to:
   https://accounts.google.com/o/oauth2/auth?
     client_id=...&
     redirect_uri=http://localhost:5173/api/auth/google/callback&
     scope=email profile
         ▼
4. User approves on Google → Redirect to callback URL with code
         ▼
5. Better Auth receives callback:
   - Exchange code for access token (Google API)
   - Fetch user profile (email, name, picture)
   - Check if User exists (by email):
     - If yes: Update Account with new tokens
     - If no: Create User + Account records
   - Create Session record
   - Set "better-auth.session_token" cookie
         ▼
6. Redirect to /dashboard
         ▼
7. Dashboard loader checks session → User authenticated
```

## Security Architecture

### Authentication Security

**Session Tokens:**
- Stored in HTTP-only cookies (not accessible via JavaScript)
- Secure flag (HTTPS only in production)
- SameSite=Lax (CSRF protection)

**Password Security:**
- Hashed with bcrypt (Better Auth default)
- Never stored in plaintext
- Never returned in API responses

**OAuth Tokens:**
- Stored in Account table (encrypted at rest by database)
- Only refresh tokens persisted
- Access tokens expire after provider-defined TTL

### Database Security

**Connection:**
- DATABASE_URL via environment variable (not committed)
- SSL/TLS connection to Supabase (enforced)
- Connection pooling via Prisma

**Row-Level Security (Future):**
- Supabase RLS policies per table
- Users can only access their own data

### Environment Variables

**Server-only secrets:**
```typescript
// ✅ Safe: Only available on server
process.env.BETTER_AUTH_SECRET
process.env.GOOGLE_CLIENT_SECRET
process.env.DATABASE_URL

// ❌ Never expose:
// - Don't pass to client components
// - Don't include in client bundles
// - Don't log to console
```

## Performance Optimizations

### Server-Side Rendering (SSR)

**Benefits:**
- Faster initial page load (HTML sent immediately)
- Better SEO (search engines see full content)
- Progressive enhancement (works without JS)

**Trade-offs:**
- Slightly slower navigation (server roundtrip)
- Mitigated by React Router client-side navigation

### Caching Strategy

**Build Cache (Turborepo):**
- Cache build outputs by input hash
- Skip rebuilds if nothing changed
- Shared cache across team (via Vercel)

**Session Cache (Better Auth):**
- Cookie cache (5 min) → Avoid database lookup on every request
- Session validated only after cache expires

**Database Queries:**
- Prisma connection pooling
- Select only needed fields (avoid SELECT *)

### Code Splitting

**React Router 7 Automatic Splitting:**
- Each route is a separate chunk
- Only load code for current route
- Prefetch linked routes on hover

**Future Optimization:**
- Lazy load heavy components (Canvas, Video editors)
- Use React.lazy() + Suspense for non-critical features

## Monitoring & Observability

### Error Tracking (Sentry - Future)
```typescript
// Global error boundary
export function ErrorBoundary({ error }: { error: Error }) {
  Sentry.captureException(error)
  return <ErrorPage />
}
```

### Logging Strategy
```typescript
// Development: console.log
// Production: Structured logs (JSON)
console.log({
  level: 'info',
  message: 'User logged in',
  userId: session.user.id,
  timestamp: new Date().toISOString(),
})
```

### Performance Metrics (Future)
- Vercel Analytics (automatic)
- Custom metrics via Vercel Speed Insights
- Database query performance (Prisma logs)

## Scalability Considerations

### Current Architecture (Phase 1)
- Single server deployment (Vercel Serverless)
- Single database (Supabase PostgreSQL)
- Suitable for: 0-10K users

### Future Scalability (Phase 2+)
- Database read replicas (Supabase multi-region)
- CDN for static assets (Vercel Edge Network)
- Background jobs (Inngest for scheduling)
- File storage (Cloudinary for images/videos)
- Caching layer (Redis for session storage)

## Technology Versions

```
Node.js:           20.19+
pnpm:              10.6.1
TypeScript:        5.9.3
React:             18.3.1
React Router:      7.12.0
Vite:              6.3.6
Prisma:            6.16.3
Better Auth:       1.4.18
Tailwind CSS:      4.1.0
Turborepo:         2.8.1
Vitest:            3.2.1
```

## Development Workflow Summary

```
1. Clone repo → pnpm install
         ▼
2. Configure .env (DATABASE_URL, BETTER_AUTH_SECRET)
         ▼
3. pnpm db:push → Sync database schema
         ▼
4. pnpm dev → Start development server
         ▼
5. Make changes → HMR updates automatically
         ▼
6. pnpm test → Run tests
         ▼
7. pnpm lint + format → Check code quality
         ▼
8. Git commit → Conventional commit message
         ▼
9. Git push → Vercel auto-deploys to preview
         ▼
10. Merge to main → Deploy to production
```
