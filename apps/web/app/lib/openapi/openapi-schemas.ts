import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

// Post schemas
export const PostSchema = z
  .object({
    id: z.string().openapi({ description: 'Unique post identifier' }),
    content: z.string().openapi({ description: 'Post content text' }),
    mediaUrls: z.array(z.string()).openapi({ description: 'Media URLs attached to post' }),
    platform: z.string().openapi({ description: 'Social media platform' }),
    status: z.string().openapi({ description: 'Post status: draft, scheduled, published, failed' }),
    scheduledAt: z.string().nullable().openapi({ description: 'ISO timestamp when post is scheduled' }),
    publishedAt: z.string().nullable().openapi({ description: 'ISO timestamp when post was published' }),
    createdAt: z.string().openapi({ description: 'ISO timestamp when post was created' }),
    updatedAt: z.string().openapi({ description: 'ISO timestamp when post was last updated' }),
  })
  .openapi('Post')

export const CreatePostSchema = z
  .object({
    content: z.string().openapi({ description: 'Post content text (required)' }),
    platform: z.string().optional().openapi({ description: 'Platform name (required if socialAccountId not provided)' }),
    socialAccountId: z.string().optional().openapi({ description: 'Social account ID (required if platform not provided)' }),
    mediaUrls: z.array(z.string()).optional().openapi({ description: 'Optional media URLs to attach' }),
    scheduledAt: z.string().optional().openapi({ description: 'Optional ISO timestamp to schedule post' }),
  })
  .openapi('CreatePost')

export const ListPostsResponseSchema = z
  .object({
    posts: z.array(PostSchema).openapi({ description: 'Array of posts' }),
    limit: z.number().openapi({ description: 'Page limit applied' }),
    offset: z.number().openapi({ description: 'Page offset applied' }),
  })
  .openapi('ListPostsResponse')

export const CreatePostResponseSchema = z
  .object({
    post: PostSchema.openapi({ description: 'Created post' }),
  })
  .openapi('CreatePostResponse')

// User schemas
export const OrganizationSchema = z
  .object({
    id: z.string().openapi({ description: 'Organization ID' }),
    name: z.string().openapi({ description: 'Organization name' }),
    slug: z.string().openapi({ description: 'Organization slug' }),
    role: z.string().openapi({ description: 'User role in organization' }),
  })
  .openapi('Organization')

export const UserSchema = z
  .object({
    id: z.string().openapi({ description: 'User ID' }),
    name: z.string().nullable().openapi({ description: 'User display name' }),
    email: z.string().openapi({ description: 'User email address' }),
    image: z.string().nullable().openapi({ description: 'User profile image URL' }),
    createdAt: z.string().openapi({ description: 'ISO timestamp when user was created' }),
    organizations: z.array(OrganizationSchema).openapi({ description: 'Organizations user belongs to' }),
  })
  .openapi('User')

export const UserMeResponseSchema = z
  .object({
    user: UserSchema.openapi({ description: 'Authenticated user profile' }),
  })
  .openapi('UserMeResponse')

// Auth schemas
export const AuthVerifyResponseSchema = z
  .object({
    authenticated: z.boolean().openapi({ description: 'Whether API key is valid' }),
    userId: z.string().openapi({ description: 'User ID associated with API key' }),
    scopes: z.array(z.string()).openapi({ description: 'API key permission scopes' }),
    rateLimit: z.number().openapi({ description: 'Rate limit (requests per minute)' }),
  })
  .openapi('AuthVerifyResponse')

// Export schemas
export const ExportSchema = z
  .object({
    id: z.string().openapi({ description: 'Project ID' }),
    name: z.string().openapi({ description: 'Project name' }),
    type: z.string().openapi({ description: 'Project type: canvas or video' }),
    thumbnail: z.string().nullable().openapi({ description: 'Project thumbnail URL' }),
    createdAt: z.string().openapi({ description: 'ISO timestamp when project was created' }),
    updatedAt: z.string().openapi({ description: 'ISO timestamp when project was last updated' }),
  })
  .openapi('Export')

export const RecentExportsResponseSchema = z
  .object({
    exports: z.array(ExportSchema).openapi({ description: 'Recent exports from last hour' }),
  })
  .openapi('RecentExportsResponse')

export const RecentPostsResponseSchema = z
  .object({
    posts: z.array(PostSchema).openapi({ description: 'Recent posts from last hour' }),
  })
  .openapi('RecentPostsResponse')

// Error schemas
export const ApiErrorSchema = z
  .object({
    error: z.string().openapi({ description: 'Error message' }),
  })
  .openapi('ApiError')
