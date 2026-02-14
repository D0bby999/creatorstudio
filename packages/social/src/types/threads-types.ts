// Threads API types for container-based publishing

export interface ThreadsPostResponse {
  id: string
  permalink?: string
}

export type ThreadsMediaType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'CAROUSEL'

export type ThreadsReplyControl = 'everyone' | 'accounts_you_follow' | 'mentioned_only'

export type ThreadsContainerStatus = 'EXPIRED' | 'ERROR' | 'FINISHED' | 'IN_PROGRESS' | 'PUBLISHED'

export interface ThreadsMediaParams {
  mediaType: ThreadsMediaType
  text?: string
  imageUrl?: string
  videoUrl?: string
  replyControl?: ThreadsReplyControl
  children?: string[]
}

export interface ThreadsInsights {
  views: number
  likes: number
  replies: number
  reposts: number
  quotes: number
}
