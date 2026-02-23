/** Template category types and metadata */

export type TemplateCategory = 'social-media' | 'marketing' | 'presentation' | 'blank'

export interface CategoryMetadata {
  id: TemplateCategory
  name: string
  description: string
  icon: string
}

export const TEMPLATE_CATEGORIES: CategoryMetadata[] = [
  {
    id: 'social-media',
    name: 'Social Media',
    description: 'Templates for Instagram, Twitter, TikTok, etc.',
    icon: '📱',
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Ads, banners, promotional materials',
    icon: '📢',
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Slides, pitch decks, reports',
    icon: '📊',
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    icon: '🎨',
  },
]

export type TemplateTag =
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'pinterest'
  | 'square'
  | 'vertical'
  | 'horizontal'
  | 'story'
  | 'post'
  | 'cover'
  | 'banner'
  | 'ad'
  | 'slide'

/** Map platform categories to template categories */
export function mapPlatformToCategory(platform: string): TemplateCategory {
  const lower = platform.toLowerCase()

  if (['instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'linkedin', 'pinterest'].includes(lower)) {
    return 'social-media'
  }

  if (lower === 'general' || lower === 'presentation') {
    return 'presentation'
  }

  return 'blank'
}

/** Get category metadata by ID */
export function getCategoryMetadata(categoryId: TemplateCategory): CategoryMetadata | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === categoryId)
}

/** Extract tags from template properties */
export function extractTemplateTags(template: {
  id: string
  name: string
  category: string
}): TemplateTag[] {
  const tags: TemplateTag[] = []
  const lower = template.id.toLowerCase() + template.name.toLowerCase() + template.category.toLowerCase()

  // Platform tags
  if (lower.includes('instagram') || lower.includes('ig')) tags.push('instagram')
  if (lower.includes('twitter') || lower.includes('tw')) tags.push('twitter')
  if (lower.includes('facebook') || lower.includes('fb')) tags.push('facebook')
  if (lower.includes('tiktok') || lower.includes('tt')) tags.push('tiktok')
  if (lower.includes('youtube') || lower.includes('yt')) tags.push('youtube')
  if (lower.includes('linkedin') || lower.includes('li')) tags.push('linkedin')
  if (lower.includes('pinterest') || lower.includes('pin')) tags.push('pinterest')

  // Format tags
  if (lower.includes('story')) tags.push('story')
  if (lower.includes('post')) tags.push('post')
  if (lower.includes('cover')) tags.push('cover')
  if (lower.includes('banner') || lower.includes('header')) tags.push('banner')
  if (lower.includes('ad')) tags.push('ad')
  if (lower.includes('slide') || lower.includes('presentation')) tags.push('slide')

  // Orientation tags (basic heuristic)
  if (lower.includes('square')) tags.push('square')
  if (lower.includes('vertical') || lower.includes('story')) tags.push('vertical')
  if (lower.includes('horizontal') || lower.includes('banner')) tags.push('horizontal')

  return tags
}
