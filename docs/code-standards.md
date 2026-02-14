# Code Standards

## File Naming Conventions

### General Rules
- Use **kebab-case** for all file names
- Descriptive names that indicate purpose (length doesn't matter)
- Self-documenting for LLM tools (Grep, Glob, Search)

### Examples
```
✅ GOOD:
- user-authentication-service.ts
- social-media-post-scheduler.tsx
- video-timeline-editor.tsx
- canvas-export-utils.ts
- auth-middleware.ts

❌ AVOID:
- utils.ts (too generic)
- UserAuthenticationService.ts (not kebab-case)
- uap.ts (unclear abbreviation)
```

### File Types
- **Routes:** `kebab-case.tsx` (e.g., `sign-in.tsx`, `dashboard.tsx`)
- **Components:** `kebab-case.tsx` (e.g., `user-avatar.tsx`, `nav-sidebar.tsx`)
- **Utilities:** `kebab-case.ts` (e.g., `format-date.ts`, `validate-email.ts`)
- **Hooks:** `use-kebab-case.ts` (e.g., `use-auth-session.ts`, `use-project-data.ts`)
- **Types:** `kebab-case.ts` (e.g., `project-types.ts`, `api-response-types.ts`)
- **Tests:** `kebab-case.test.ts` (e.g., `auth-middleware.test.ts`)

## File Size Management

### Maximum Lines
- **Code files:** 200 lines maximum
- **Documentation:** 800 lines maximum
- **Configuration:** No limit

### Refactoring Strategy
When a file exceeds 200 lines:
1. Identify logical separation boundaries
2. Extract functions into utility modules
3. Split components into smaller components
4. Create service classes for business logic
5. Use composition over inheritance

### Example Split
```typescript
// Before: user-management.ts (300 lines)

// After:
user-validation.ts           // 80 lines
user-authentication.ts       // 90 lines
user-profile-service.ts      // 70 lines
user-permissions.ts          // 60 lines
```

## TypeScript Standards

### Configuration
- **Strict mode:** Enabled
- **Target:** ES2022
- **Module:** ESNext
- **JSX:** react-jsx

### Type Safety
```typescript
// ✅ GOOD: Explicit types for function parameters and returns
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ❌ AVOID: Implicit any types
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ✅ GOOD: Type inference for simple cases
const count = 0  // TypeScript infers number

// ✅ GOOD: Explicit types for complex objects
interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: Date
}
```

### Naming Conventions
- **Interfaces:** PascalCase (e.g., `UserProfile`, `ProjectData`)
- **Types:** PascalCase (e.g., `SessionToken`, `AuthProvider`)
- **Enums:** PascalCase (e.g., `ProjectType`, `UserRole`)
- **Variables:** camelCase (e.g., `userId`, `projectName`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`, `API_TIMEOUT`)
- **Functions:** camelCase (e.g., `getUserById`, `validateToken`)

### Avoid `any`
```typescript
// ❌ AVOID
function processData(data: any): any {
  return data.transform()
}

// ✅ GOOD: Use generics or specific types
function processData<T>(data: T): T {
  return data
}

// ✅ GOOD: Use unknown when type is truly unknown
function processData(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    // Type guard before usage
  }
}
```

## ESLint Configuration

### Parser & Plugins
- Parser: `@typescript-eslint/parser`
- Plugins: `@typescript-eslint`, `react`, `react-hooks`

### Key Rules
```javascript
{
  // Warn on unused variables (allow underscore prefix)
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

  // Warn on explicit any (avoid when possible)
  '@typescript-eslint/no-explicit-any': 'warn',

  // React prop-types not needed with TypeScript
  'react/prop-types': 'off'
}
```

### Ignore Patterns
- `build/`
- `node_modules/`
- `.react-router/`
- `.turbo/`

## Prettier Configuration

### Rules
```json
{
  "semi": false,                    // No semicolons
  "singleQuote": true,              // Single quotes for strings
  "trailingComma": "all",           // Trailing commas everywhere
  "tabWidth": 2,                    // 2-space indentation
  "printWidth": 100,                // 100-character line width
  "plugins": ["prettier-plugin-tailwindcss"]  // Sort Tailwind classes
}
```

### Example
```typescript
// ✅ GOOD: Follows Prettier rules
const user = {
  id: 'abc123',
  name: 'John Doe',
  email: 'john@example.com',
}

export function greetUser(name: string): string {
  return `Hello, ${name}!`
}

// ❌ AVOID: Violates Prettier rules
const user = {
  id: "abc123",
  name: "John Doe",
  email: "john@example.com"
};

export function greetUser(name: string): string {
  return `Hello, ${name}!`;
}
```

## Import Conventions

### Order
1. External dependencies
2. Workspace packages
3. Relative imports (types, components, utilities)

### Example
```typescript
// 1. External dependencies
import { useState } from 'react'
import { useLoaderData } from 'react-router'

// 2. Workspace packages
import { prisma } from '@creator-studio/db/client'
import { auth } from '@creator-studio/auth/server'
import { Button } from '@creator-studio/ui/components/button'

// 3. Relative imports
import type { Route } from './+types/dashboard'
import { validateSession } from '../lib/auth-utils'
```

### Workspace Package Imports
```typescript
// ✅ GOOD: Use workspace package aliases
import { prisma } from '@creator-studio/db/client'
import { Button } from '@creator-studio/ui/components/button'

// ❌ AVOID: Relative paths to other packages
import { prisma } from '../../../packages/db/src/client'
```

### Path Aliases
- `@creator-studio/db` → `packages/db/src`
- `@creator-studio/auth` → `packages/auth/src`
- `@creator-studio/ui` → `packages/ui/src`

## React Router 7 Conventions

### File-Based Routing
```
app/routes/
├── home.tsx                    → /
├── sign-in.tsx                 → /sign-in
├── sign-up.tsx                 → /sign-up
├── dashboard/
│   ├── layout.tsx              → /dashboard/* (wrapper)
│   ├── index.tsx               → /dashboard
│   ├── canvas.tsx              → /dashboard/canvas
│   └── video.tsx               → /dashboard/video
└── api.auth.$.ts               → /api/auth/* (catch-all)
```

### Route Module Pattern
```typescript
// dashboard.tsx
import type { Route } from './+types/dashboard'

// Loader runs on server
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.getSession(request)
  if (!session) {
    throw redirect('/sign-in')
  }

  return { user: session.user }
}

// Component renders on client
export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.user.name}</div>
}
```

### Type Generation
```typescript
// Use generated route types
import type { Route } from './+types/dashboard'

// Available types:
// - Route.LoaderArgs
// - Route.ActionArgs
// - Route.ComponentProps
```

## Design System Standards

### Using Tailwind CSS 4 with Design Tokens

**Golden Rule:** Use TW4 utility classes based on design tokens, NOT inline CSS custom properties.

```typescript
// ✅ GOOD: Use design token-based utilities
className="bg-primary text-muted-foreground border border-input rounded-md"

// ❌ AVOID: Inline hsl() with CSS variables
className="bg-[hsl(var(--color-primary))] text-[hsl(var(--color-muted-foreground))]"

// ✅ GOOD: Use semantic color names
{
  variant: {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }
}

// ❌ AVOID: Hard-coded colors
{
  variant: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
  }
}
```

### Design Token Categories

```typescript
// Color Tokens (available as TW4 utilities)
- bg-primary, bg-secondary, bg-destructive, bg-muted
- text-primary-foreground, text-secondary-foreground, text-muted-foreground
- border-input, border-border, border-primary

// Spacing Tokens
- space-unit (base unit for all spacing)
- gap-sm, gap-md, gap-lg, gap-xl
- p-sm, p-md, p-lg, p-xl

// Typography
- text-sm, text-base, text-lg, text-xl, text-2xl
- font-normal, font-semibold, font-bold

// Radius
- rounded-sm, rounded-md, rounded-lg
```

### Composite Component Structure

Composite components go in `packages/ui/src/components/composites/`.

```typescript
// Example: split-screen-auth.tsx
import { ReactNode } from 'react'
import { cn } from '@creator-studio/ui/lib/utils'

export interface SplitScreenAuthProps {
  left: ReactNode
  right: ReactNode
  className?: string
}

export function SplitScreenAuth({ left, right, className }: SplitScreenAuthProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-0 min-h-screen', className)}>
      <div className="bg-gradient-to-br from-primary to-primary/80 p-8 flex items-center justify-center">
        {left}
      </div>
      <div className="p-8 flex items-center justify-center">
        {right}
      </div>
    </div>
  )
}
```

### Theme Switching

```typescript
// Access theme context in components
import { useTheme } from '@creator-studio/ui/lib/theme-utils'

export function ThemedComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Current: {theme}
    </button>
  )
}
```

## Component Standards

### Functional Components
```typescript
// ✅ GOOD: Explicit prop types
interface UserAvatarProps {
  name: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

export function UserAvatar({ name, imageUrl, size = 'md' }: UserAvatarProps) {
  return (
    <div className={cn('rounded-full', sizeClasses[size])}>
      {imageUrl ? <img src={imageUrl} alt={name} /> : <span>{name[0]}</span>}
    </div>
  )
}
```

### Component File Structure
```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@creator-studio/ui/components/button'
import { cn } from '@creator-studio/ui/lib/utils'

// 2. Types
interface ComponentProps {
  // ...
}

// 3. Component
export function Component(props: ComponentProps) {
  // ...
}
```

### Composition Over Inheritance
```typescript
// ✅ GOOD: Composition
function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <UserAvatar name={user.name} imageUrl={user.image} />
      <UserInfo user={user} />
    </Card>
  )
}

// ❌ AVOID: Large monolithic components
function UserCard({ user }: { user: User }) {
  return (
    <div>
      {/* 200 lines of mixed concerns */}
    </div>
  )
}
```

## Error Handling

### Try-Catch Pattern
```typescript
// ✅ GOOD: Specific error handling
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw new Error(`User not found: ${id}`)
  }
}
```

### Error Boundaries (React)
```typescript
// Error boundary component for route-level errors
export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <pre>{error.message}</pre>
    </div>
  )
}
```

### Validation Errors
```typescript
// ✅ GOOD: Clear validation messages
export function validateProjectName(name: string): string | null {
  if (!name) return 'Project name is required'
  if (name.length < 3) return 'Project name must be at least 3 characters'
  if (name.length > 100) return 'Project name must be less than 100 characters'
  return null
}
```

## Testing Standards

### Vitest Configuration
- Framework: Vitest 3.2.1
- Config: `vitest.config.ts`

### Test Structure
```typescript
// user-validation.test.ts
import { describe, it, expect } from 'vitest'
import { validateEmail } from './user-validation'

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('user@')).toBe(false)
  })
})
```

### Test Naming
```typescript
// Format: describe('function/component', () => {
//   it('should behavior when condition', () => {})
// })

describe('UserAvatar', () => {
  it('should display user initials when no image provided', () => {
    // ...
  })

  it('should display image when imageUrl provided', () => {
    // ...
  })
})
```

## Security Standards

### Environment Variables
```typescript
// ✅ GOOD: Validate required env vars at startup
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is required')
}

// ✅ GOOD: Never expose secrets to client
// Server-side only
const secret = process.env.BETTER_AUTH_SECRET
```

### Authentication
```typescript
// ✅ GOOD: Validate session on protected routes
export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.getSession(request)

  if (!session) {
    throw redirect('/sign-in')
  }

  return { user: session.user }
}
```

### Input Validation
```typescript
// ✅ GOOD: Validate and sanitize user input
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const email = formData.get('email')

  if (typeof email !== 'string' || !validateEmail(email)) {
    return { error: 'Invalid email address' }
  }

  // Proceed with validated input
}
```

## Performance Standards

### Code Splitting
```typescript
// ✅ GOOD: Lazy load heavy components
import { lazy, Suspense } from 'react'

const VideoEditor = lazy(() => import('./video-editor'))

export function Dashboard() {
  return (
    <Suspense fallback={<Loading />}>
      <VideoEditor />
    </Suspense>
  )
}
```

### Database Queries
```typescript
// ✅ GOOD: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
})

// ❌ AVOID: Fetching all fields unnecessarily
const user = await prisma.user.findUnique({ where: { id } })
```

## Comments & Documentation

### When to Comment
- Complex algorithms or business logic
- Non-obvious workarounds or hacks
- API usage examples
- Security considerations

### Comment Style
```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Hash password with bcrypt (cost factor 10) to meet OWASP recommendations
const hashedPassword = await hash(password, 10)

// ❌ AVOID: Obvious comments
// Hash the password
const hashedPassword = await hash(password, 10)
```

### JSDoc for Public APIs
```typescript
/**
 * Validates user email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

## Git Commit Standards

### Conventional Commits
```
feat: add video timeline editor
fix: resolve authentication session timeout
docs: update API documentation
refactor: simplify user validation logic
test: add tests for project creation
chore: update dependencies
```

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Examples
```
feat(auth): implement Google OAuth login

- Add Google provider to Better Auth config
- Create OAuth callback route
- Update sign-in page with Google button

Closes #123
```

## Pre-commit Checks

### Required
- `pnpm lint` → Must pass
- `pnpm format:check` → Must pass
- `pnpm typecheck` → Must pass
- `pnpm test` → Must pass

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/sh
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
```

## Code Review Standards

### Checklist
- [ ] Follows file naming conventions
- [ ] No files exceed 200 lines (code) or 800 lines (docs)
- [ ] TypeScript strict mode compliant
- [ ] ESLint and Prettier rules followed
- [ ] Tests pass and cover new functionality
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Documentation updated if needed

### Review Focus
1. **Correctness** → Does it work as intended?
2. **Security** → Are there vulnerabilities?
3. **Performance** → Are there bottlenecks?
4. **Maintainability** → Is it easy to understand and modify?
5. **Testing** → Is it adequately tested?
