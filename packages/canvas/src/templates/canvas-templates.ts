/** Predefined canvas templates for common social media formats */
export interface CanvasTemplate {
  id: string
  name: string
  category: string
  width: number
  height: number
  description: string
}

export const canvasTemplates: CanvasTemplate[] = [
  // Instagram
  {
    id: 'ig-post',
    name: 'Instagram Post',
    category: 'Instagram',
    width: 1080,
    height: 1080,
    description: 'Square post (1:1)',
  },
  {
    id: 'ig-story',
    name: 'Instagram Story',
    category: 'Instagram',
    width: 1080,
    height: 1920,
    description: 'Vertical story (9:16)',
  },
  {
    id: 'ig-reel-cover',
    name: 'Reel Cover',
    category: 'Instagram',
    width: 1080,
    height: 1920,
    description: 'Reel cover image',
  },
  // YouTube
  {
    id: 'yt-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'YouTube',
    width: 1280,
    height: 720,
    description: 'Video thumbnail (16:9)',
  },
  {
    id: 'yt-banner',
    name: 'YouTube Banner',
    category: 'YouTube',
    width: 2560,
    height: 1440,
    description: 'Channel banner',
  },
  // Twitter/X
  {
    id: 'tw-post',
    name: 'Twitter Post',
    category: 'Twitter',
    width: 1200,
    height: 675,
    description: 'Post image (16:9)',
  },
  {
    id: 'tw-header',
    name: 'Twitter Header',
    category: 'Twitter',
    width: 1500,
    height: 500,
    description: 'Profile header (3:1)',
  },
  // Facebook
  {
    id: 'fb-post',
    name: 'Facebook Post',
    category: 'Facebook',
    width: 1200,
    height: 630,
    description: 'Post image',
  },
  // TikTok
  {
    id: 'tt-cover',
    name: 'TikTok Cover',
    category: 'TikTok',
    width: 1080,
    height: 1920,
    description: 'Video cover (9:16)',
  },
  // General
  {
    id: 'presentation',
    name: 'Presentation Slide',
    category: 'General',
    width: 1920,
    height: 1080,
    description: 'Widescreen slide (16:9)',
  },
]

/** Group templates by category */
export function getTemplatesByCategory(): Record<string, CanvasTemplate[]> {
  const grouped: Record<string, CanvasTemplate[]> = {}
  for (const template of canvasTemplates) {
    if (!grouped[template.category]) {
      grouped[template.category] = []
    }
    grouped[template.category].push(template)
  }
  return grouped
}
