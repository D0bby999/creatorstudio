import type { FileType } from './storage-types';

/**
 * Generate organized path for media files
 * Format: media/{userId}/{type}/{timestamp}-{filename}
 */
export function generateMediaPath(
  userId: string,
  type: FileType,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = sanitizeFilename(filename);
  return `media/${userId}/${type}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Sanitize filename to be safe for storage
 * - Remove path traversal characters
 * - Replace spaces with hyphens
 * - Keep only alphanumeric, hyphens, underscores, and dots
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/\//g, '') // Remove slashes
    .replace(/\\/g, '') // Remove backslashes
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9._-]/g, '') // Keep only safe characters
    .toLowerCase();
}

/**
 * Extract user ID from media key path
 */
export function extractUserIdFromKey(key: string): string | null {
  const match = key.match(/^media\/([^/]+)\//);
  return match?.[1] ?? null;
}

/**
 * Extract file type from media key path
 */
export function extractFileTypeFromKey(key: string): FileType | null {
  const match = key.match(/^media\/[^/]+\/([^/]+)\//);
  const type = match?.[1];

  const validTypes: FileType[] = [
    'video-export',
    'canvas-export',
    'social-upload',
    'thumbnail',
  ];

  return validTypes.includes(type as FileType) ? (type as FileType) : null;
}
