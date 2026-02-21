/**
 * Platform-aware thumbnail generation
 * Wraps existing image-generation.ts with optimized prompts per platform
 */

import { generateImage } from './image-generation'
import type { ImageGenerationResult } from '../types/ai-types'

interface PlatformDimensions {
  width: number
  height: number
  description: string
}

const PLATFORM_THUMBNAIL_SPECS: Record<string, PlatformDimensions> = {
  instagram: { width: 1080, height: 1080, description: 'square Instagram post' },
  youtube: { width: 1280, height: 720, description: 'YouTube video thumbnail' },
  tiktok: { width: 1080, height: 1920, description: 'vertical TikTok cover' },
  linkedin: { width: 1200, height: 627, description: 'LinkedIn article image' },
  twitter: { width: 1200, height: 675, description: 'Twitter card image' },
  facebook: { width: 1200, height: 630, description: 'Facebook post image' },
}

const DEFAULT_SPECS: PlatformDimensions = {
  width: 1280,
  height: 720,
  description: 'social media thumbnail',
}

/**
 * Generate a platform-optimized thumbnail for content
 * Builds smart prompts based on platform specs and content
 */
export async function generateThumbnail(
  content: string,
  platform: string
): Promise<ImageGenerationResult> {
  const specs = PLATFORM_THUMBNAIL_SPECS[platform.toLowerCase()] ?? DEFAULT_SPECS

  // Summarize content to max 200 chars for prompt
  const contentSummary = content.length > 200
    ? content.slice(0, 200) + '...'
    : content

  const prompt = `Create an eye-catching ${specs.description} thumbnail for: "${contentSummary}". Bold text overlay, vibrant colors, high contrast, professional design. Optimized for ${platform} at ${specs.width}x${specs.height}.`

  return generateImage(prompt, {
    width: specs.width,
    height: specs.height,
  })
}
