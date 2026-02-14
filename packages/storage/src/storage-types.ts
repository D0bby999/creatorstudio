export type FileType =
  | 'video-export'
  | 'canvas-export'
  | 'social-upload'
  | 'thumbnail';

export interface StorageFile {
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface UploadConfig {
  maxSize: number;
  allowedTypes: string[];
  ttl: number;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

export const UPLOAD_CONFIGS: Record<FileType, UploadConfig> = {
  'video-export': {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/webm'],
    ttl: 15 * 60, // 15 minutes
  },
  'canvas-export': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
    ttl: 15 * 60,
  },
  'social-upload': {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ttl: 15 * 60,
  },
  'thumbnail': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    ttl: 15 * 60,
  },
};
