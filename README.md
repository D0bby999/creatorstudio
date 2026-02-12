# Creator Studio

## Vision

**All-in-one creative toolkit for content creators.**

A unified platform that aggregates essential creator tools into one workspace — eliminating the need to juggle between Canva, CapCut, Buffer, SEMrush, and ChatGPT.

## Purpose

Content creators today use 5-10 separate tools for their workflow. Creator Studio consolidates them into a single platform:

| Tool Category | What It Does | Replaces |
|---------------|-------------|----------|
| **Image Editor** | Canvas design with templates, shapes, text, export | Canva, Figma |
| **Video Editor** | Timeline editing, transitions, effects, MP4 export | CapCut, Clipchamp |
| **Crawler & Analytics** | Web scraping, trend analysis, SEO insights, competitor research | SEMrush, Ahrefs, Google Trends |
| **Social Management** | Multi-platform scheduling, posting, engagement analytics | Buffer, Hootsuite, Postiz |
| **AI Creative Tools** | Content generation, design suggestions, writing assistance, image generation | ChatGPT, Midjourney, Copy.ai |

## Target Audience

- Solo content creators (YouTubers, Instagram influencers, TikTokers)
- Small creative agencies (2-10 people)
- Social media managers
- Freelance designers and marketers

## Core Principles

1. **Creator-first UX** — Tools designed for non-technical creators, not developers
2. **All-in-one** — Reduce tool-switching friction, keep everything in one workspace
3. **AI-augmented** — AI assists at every step (research → create → publish → analyze)
4. **Platform-agnostic** — Support all major social platforms (Instagram, TikTok, YouTube, X, LinkedIn)

## Tech Stack

- **Frontend**: React Router 7.12, React 18, TypeScript, Turborepo
- **Auth**: Better Auth
- **Database**: Prisma 6.16.3 → Supabase PostgreSQL
- **Storage**: Cloudinary
- **Canvas**: Tldraw SDK
- **Video**: Remotion + FFmpeg.wasm
- **AI**: Vercel AI SDK (multi-provider: OpenAI, Anthropic, Google)
- **Scheduling**: Inngest
- **Monitoring**: Sentry
- **Deploy**: Vercel

## Project Structure

```
creator-studio/          (Turborepo monorepo)
├── apps/web/            React Router 7 app
├── packages/ui/         Shared UI (shadcn/ui)
├── packages/auth/       Better Auth config
├── packages/db/         Prisma schema
├── packages/ai/         Vercel AI SDK agents
├── packages/social/     Social platform adapters
├── packages/video/      Remotion compositor
├── packages/crawler/    Web scraping & analysis
└── packages/canvas/     Tldraw extensions
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Run tests
npm run test
```

## License

Private — All rights reserved.
