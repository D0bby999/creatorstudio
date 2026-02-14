// TikTok Content Posting API types

export interface TikTokUploadResponse {
  publishId: string
  uploadUrl: string
}

export type TikTokPublishStatus =
  | 'PROCESSING_UPLOAD'
  | 'PROCESSING_DOWNLOAD'
  | 'SEND_TO_USER_INBOX'
  | 'PUBLISH_COMPLETE'
  | 'FAILED'

export type TikTokPrivacyLevel =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'FOLLOWER_OF_CREATOR'
  | 'SELF_ONLY'

export interface TikTokStatusResponse {
  status: TikTokPublishStatus
  publiclyAvailablePostId?: string[]
  failReason?: string
}

export interface TikTokUserInfo {
  openId: string
  unionId: string
  displayName: string
  avatarUrl: string
}

export interface TikTokVideoInitParams {
  title: string
  privacyLevel: TikTokPrivacyLevel
  videoSize: number
  chunkSize?: number
  totalChunkCount?: number
}
