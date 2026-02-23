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

  // Platform tags — use full names only to avoid false positives from short abbreviations
  // Template IDs already use clear prefixes like `ig-`, `tw-`, `fb-` which match full words
  const id = template.id.toLowerCase()
  if (lower.includes('instagram') || id.startsWith('ig-')) tags.push('instagram')
  if (lower.includes('twitter') || id.startsWith('tw-')) tags.push('twitter')
  if (lower.includes('facebook') || id.startsWith('fb-')) tags.push('facebook')
  if (lower.includes('tiktok') || id.startsWith('tt-')) tags.push('tiktok')
  if (lower.includes('youtube') || id.startsWith('yt-')) tags.push('youtube')
  if (lower.includes('linkedin') || id.startsWith('li-')) tags.push('linkedin')
  if (lower.includes('pinterest') || id.startsWith('pin-')) tags.push('pinterest')

  // Format tags
  if (lower.includes('story')) tags.push('story')
  if (lower.includes('post')) tags.push('post')
  if (lower.includes('cover')) tags.push('cover')
  if (lower.includes('banner') || lower.includes('header')) tags.push('banner')
  if (lower.includes('advertisement') || id.startsWith('ad-')) tags.push('ad')
  if (lower.includes('slide') || lower.includes('presentation')) tags.push('slide')

  // Orientation tags (basic heuristic)
  if (lower.includes('square')) tags.push('square')
  if (lower.includes('vertical') || lower.includes('story')) tags.push('vertical')
  if (lower.includes('horizontal') || lower.includes('banner')) tags.push('horizontal')

  return tags
}
