// Facebook Graph API types for Pages posting

export interface FacebookPostResponse {
  id: string
  postId?: string
}

export interface FacebookPageInfo {
  id: string
  name: string
  accessToken: string
  category: string
}

export type FacebookMediaType = 'text' | 'photo' | 'video' | 'link'

export interface FacebookPhotoUploadResponse {
  id: string
  postId: string
}

export interface FacebookVideoUploadResponse {
  id: string
  success: boolean
}

export interface FacebookPostInsights {
  postImpressions: number
  postEngagedUsers: number
  postClicks: number
  postReactions: number
}
