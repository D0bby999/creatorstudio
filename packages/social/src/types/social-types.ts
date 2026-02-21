// Social platform types for multi-platform support

export type SocialPlatform = 'instagram' | 'twitter' | 'linkedin' | 'bluesky' | 'facebook' | 'threads' | 'tiktok'

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed'

export interface SocialAccountData {
  id: string
  platform: SocialPlatform
  platformUserId: string
  username: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  tokenRefreshedAt?: Date
  scopesGranted: string[]
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface SocialPostData {
  id: string
  content: string
  mediaUrls: string[]
  platform: SocialPlatform
  scheduledAt?: Date
  publishedAt?: Date
  status: PostStatus
  platformPostId?: string
  parentPostId?: string
  postGroupId?: string
  failureReason?: string
  retryCount: number
  socialAccountId: string
  createdAt: Date
  updatedAt: Date
}

export interface AnalyticsSnapshot {
  date: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export interface PostAnalyticsData {
  id: string
  postId: string
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
  engagementRate: number
  snapshots: AnalyticsSnapshot[]
  fetchedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface InstagramPostResponse {
  id: string
  permalink?: string
}

export interface InstagramInsights {
  impressions: number
  reach: number
  likes: number
  comments: number
  shares: number
  saves: number
}

export interface CreatePostInput {
  content: string
  mediaUrls: string[]
  scheduledAt?: Date
  socialAccountId: string
}

export interface ScheduledPostJob {
  postId: string
  socialAccountId: string
  scheduledAt: Date
}

// Content adaptation types
export interface ContentRules {
  maxChars: number
  maxHashtags: number
  linkChars: number
  mentionPrefix: string
}

export interface AdaptedContent {
  content: string
  platform: SocialPlatform
  warnings: ContentWarning[]
  metadata: {
    characterCount: number
    hashtagCount: number
    mentionCount: number
    linkCount: number
    truncated: boolean
  }
}

export type ContentWarning =
  | { type: 'truncated'; originalLength: number; maxLength: number }
  | { type: 'hashtags_stripped'; removed: string[]; maxAllowed: number }
  | { type: 'links_counted_as_shortened'; platform: string; charsPer: number }

// Post preview & validation types
export interface ValidationError {
  code: 'empty_content' | 'over_char_limit' | 'over_hashtag_limit' | 'over_media_count'
  message: string
  field?: string
}

export interface ValidationWarning {
  code: 'near_char_limit' | 'hashtags_will_strip' | 'links_not_clickable'
  message: string
  platform: SocialPlatform
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface CharacterBudget {
  used: number
  remaining: number
  max: number
  percentage: number
}

export interface PostPreview {
  platform: SocialPlatform
  content: string
  characterBudget: CharacterBudget
  metadata: AdaptedContent['metadata']
  warnings: ContentWarning[]
}

export interface DraftPost {
  id: string
  userId: string
  content: string
  mediaUrls: string[]
  platforms: SocialPlatform[]
  createdAt: number
  updatedAt: number
}

// Media processing types
export interface MediaRules {
  maxFileSize: number // bytes
  acceptedFormats: string[]
  maxWidth: number
  maxHeight: number
  minWidth?: number
  minHeight?: number
  recommendedWidth?: number
  recommendedHeight?: number
}

export interface MediaValidationError {
  code: 'file_too_large' | 'unsupported_format' | 'dimensions_too_large' | 'dimensions_too_small' | 'empty_file'
  message: string
  field: string
}

export interface MediaValidationResult {
  valid: boolean
  errors: MediaValidationError[]
}

export interface MediaMetadata {
  width?: number
  height?: number
  format?: string
  size: number
  hasAlpha?: boolean
}

export interface ProcessedMedia {
  buffer: Buffer
  metadata: MediaMetadata
  originalSize: number
  processedSize: number
}

// Approval workflow types
export type ApprovalStatus = 'none' | 'pending_approval' | 'approved' | 'rejected'

export interface ApprovalEvent {
  id: string
  postId: string
  fromStatus: ApprovalStatus
  toStatus: ApprovalStatus
  userId: string
  comment?: string
  timestamp: number
}

export interface ApprovalablePost {
  id: string
  userId: string
  approvalStatus: ApprovalStatus
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: number
  approvalEvents: ApprovalEvent[]
}

export interface ApprovalTransitionResult {
  post: ApprovalablePost
  event: ApprovalEvent
}

export interface ApprovalWorkflowOptions {
  allowSelfApproval?: boolean
}

// Threading types
export interface ThreadParams {
  posts: Array<{ content: string; mediaUrls: string[] }>
  platform: SocialPlatform
  socialAccountId: string
  scheduledAt?: Date
}
