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
  // LinkedIn
  {
    id: 'li-post',
    name: 'LinkedIn Post',
    category: 'LinkedIn',
    width: 1200,
    height: 1200,
    description: 'Square post (1:1)',
  },
  {
    id: 'li-banner',
    name: 'LinkedIn Banner',
    category: 'LinkedIn',
    width: 1584,
    height: 396,
    description: 'Profile banner',
  },
  {
    id: 'li-article',
    name: 'LinkedIn Article',
    category: 'LinkedIn',
    width: 1200,
    height: 628,
    description: 'Article cover image',
  },
  // Pinterest
  {
    id: 'pin-standard',
    name: 'Pinterest Pin',
    category: 'Pinterest',
    width: 1000,
    height: 1500,
    description: 'Standard pin (2:3)',
  },
  {
    id: 'pin-square',
    name: 'Pinterest Square',
    category: 'Pinterest',
    width: 1000,
    height: 1000,
    description: 'Square pin (1:1)',
  },
  // Facebook (additional)
  {
    id: 'fb-cover',
    name: 'Facebook Cover',
    category: 'Facebook',
    width: 820,
    height: 312,
    description: 'Page cover photo',
  },
  {
    id: 'fb-story',
    name: 'Facebook Story',
    category: 'Facebook',
    width: 1080,
    height: 1920,
    description: 'Story format (9:16)',
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
