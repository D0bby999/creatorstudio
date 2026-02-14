import { z } from 'zod'
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import {
  PostSchema,
  CreatePostSchema,
  ListPostsResponseSchema,
  CreatePostResponseSchema,
  UserMeResponseSchema,
  AuthVerifyResponseSchema,
  RecentExportsResponseSchema,
  RecentPostsResponseSchema,
  ApiErrorSchema,
} from './openapi-schemas'

export function createOpenApiRegistry() {
  const registry = new OpenAPIRegistry()

  // Security scheme
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'API Key',
    description: 'API key authentication. Use format: Bearer cs_YOUR_API_KEY',
  })

  // POST /api/v1/posts - Create post
  registry.registerPath({
    method: 'post',
    path: '/api/v1/posts',
    summary: 'Create a new social media post',
    description: 'Create a new social media post (draft or scheduled). Requires posts:write scope.',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreatePostSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Post created successfully',
        content: {
          'application/json': {
            schema: CreatePostResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request body',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
      404: {
        description: 'Social account not found',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  // GET /api/v1/posts - List posts
  registry.registerPath({
    method: 'get',
    path: '/api/v1/posts',
    summary: 'List user posts',
    description: 'Get paginated list of posts for authenticated user. Requires posts:read scope.',
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({
        limit: z.number().int().max(100).default(50).optional().openapi({ description: 'Number of posts to return (max 100)' }),
        offset: z.number().int().default(0).optional().openapi({ description: 'Number of posts to skip' }),
      }),
    },
    responses: {
      200: {
        description: 'Posts retrieved successfully',
        content: {
          'application/json': {
            schema: ListPostsResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
      403: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  // GET /api/v1/users/me - Get user profile
  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me',
    summary: 'Get authenticated user profile',
    description: 'Get profile information for the authenticated user.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User profile retrieved successfully',
        content: {
          'application/json': {
            schema: UserMeResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
      404: {
        description: 'User not found',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  // GET /api/v1/auth/verify - Verify API key
  registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/verify',
    summary: 'Verify API key',
    description: 'Verify that the API key is valid and check its permissions.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'API key is valid',
        content: {
          'application/json': {
            schema: AuthVerifyResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  // GET /api/v1/zapier/posts/recent - Get recent posts (Zapier)
  registry.registerPath({
    method: 'get',
    path: '/api/v1/zapier/posts/recent',
    summary: 'Get recent posts (Zapier trigger)',
    description: 'Get posts created in the last hour. Used by Zapier polling triggers.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Recent posts retrieved successfully',
        content: {
          'application/json': {
            schema: RecentPostsResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  // GET /api/v1/zapier/exports/recent - Get recent exports (Zapier)
  registry.registerPath({
    method: 'get',
    path: '/api/v1/zapier/exports/recent',
    summary: 'Get recent exports (Zapier trigger)',
    description: 'Get canvas/video exports created in the last hour. Used by Zapier polling triggers.',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Recent exports retrieved successfully',
        content: {
          'application/json': {
            schema: RecentExportsResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid or missing API key',
        content: {
          'application/json': {
            schema: ApiErrorSchema,
          },
        },
      },
    },
  })

  return registry
}

export function generateOpenApiDocument() {
  const registry = createOpenApiRegistry()

  const generator = new OpenApiGeneratorV31(registry.definitions)

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Creator Studio API',
      version: '1.0.0',
      description: 'REST API for Creator Studio - manage posts, users, and integrations.',
    },
    servers: [
      {
        url: 'https://creatorstudio.example.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:5173',
        description: 'Development server',
      },
    ],
  })
}
