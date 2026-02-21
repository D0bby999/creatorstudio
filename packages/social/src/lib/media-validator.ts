// Media file validation against platform-specific rules
// No Sharp dependency — works with buffer + mimeType alone

import type { SocialPlatform, MediaValidationResult, MediaValidationError, MediaMetadata } from '../types/social-types'
import { PLATFORM_MEDIA_RULES } from './platform-media-rules'

const MAX_INPUT_SIZE = 20 * 1024 * 1024 // 20MB hard cap

export function validateMedia(
  buffer: Buffer,
  mimeType: string,
  platform: SocialPlatform,
  metadata?: MediaMetadata
): MediaValidationResult {
  const rules = PLATFORM_MEDIA_RULES[platform]
  const errors: MediaValidationError[] = []

  if (buffer.length === 0) {
    errors.push({ code: 'empty_file', message: 'File is empty', field: 'buffer' })
    return { valid: false, errors }
  }

  if (buffer.length > MAX_INPUT_SIZE) {
    errors.push({
      code: 'file_too_large',
      message: `File exceeds absolute maximum of 20MB`,
      field: 'size',
    })
    return { valid: false, errors }
  }

  if (buffer.length > rules.maxFileSize) {
    const maxMB = (rules.maxFileSize / (1024 * 1024)).toFixed(0)
    errors.push({
      code: 'file_too_large',
      message: `File size ${(buffer.length / (1024 * 1024)).toFixed(1)}MB exceeds ${platform} limit of ${maxMB}MB`,
      field: 'size',
    })
  }

  if (!rules.acceptedFormats.includes(mimeType)) {
    errors.push({
      code: 'unsupported_format',
      message: `Format ${mimeType} not supported on ${platform}. Accepted: ${rules.acceptedFormats.join(', ')}`,
      field: 'format',
    })
  }

  if (metadata?.width && metadata?.height) {
    if (metadata.width > rules.maxWidth || metadata.height > rules.maxHeight) {
      errors.push({
        code: 'dimensions_too_large',
        message: `Dimensions ${metadata.width}x${metadata.height} exceed ${platform} max ${rules.maxWidth}x${rules.maxHeight}`,
        field: 'dimensions',
      })
    }

    if (rules.minWidth && rules.minHeight) {
      if (metadata.width < rules.minWidth || metadata.height < rules.minHeight) {
        errors.push({
          code: 'dimensions_too_small',
          message: `Dimensions ${metadata.width}x${metadata.height} below ${platform} min ${rules.minWidth}x${rules.minHeight}`,
          field: 'dimensions',
        })
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateMediaForPlatforms(
  files: Array<{ buffer: Buffer; mimeType: string; metadata?: MediaMetadata }>,
  platforms: SocialPlatform[]
): Record<SocialPlatform, MediaValidationResult[]> {
  const results = {} as Record<SocialPlatform, MediaValidationResult[]>

  for (const platform of platforms) {
    results[platform] = files.map((file) =>
      validateMedia(file.buffer, file.mimeType, platform, file.metadata)
    )
  }

  return results
}
