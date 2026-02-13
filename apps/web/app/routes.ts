import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('sign-in', 'routes/sign-in.tsx'),
  route('sign-up', 'routes/sign-up.tsx'),
  route('api/auth/*', 'routes/api.auth.$.ts'),
  route('api/ai', 'routes/api.ai.ts'),
  route('api/organizations', 'routes/api.organizations.ts'),
  layout('routes/dashboard/layout.tsx', [
    route('dashboard', 'routes/dashboard/index.tsx'),
    route('dashboard/canvas', 'routes/dashboard/canvas.tsx'),
    route('dashboard/video', 'routes/dashboard/video.tsx'),
    route('dashboard/social', 'routes/dashboard/social.tsx'),
    route('dashboard/crawler', 'routes/dashboard/crawler.tsx'),
    route('dashboard/ai', 'routes/dashboard/ai.tsx'),
    route('dashboard/organizations', 'routes/dashboard/organizations.tsx'),
    route('dashboard/organizations/:orgId', 'routes/dashboard/organizations.$orgId.tsx'),
  ]),
] satisfies RouteConfig
