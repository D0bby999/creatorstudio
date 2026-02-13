export interface ContentTemplate {
  id: string
  platform: string
  type: string
  systemPrompt: string
  maxLength: number
}

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'instagram-caption',
    platform: 'instagram',
    type: 'caption',
    systemPrompt: 'Write an engaging Instagram caption. Use storytelling, include 3-5 relevant hashtags. Keep under 2200 characters. Use emojis sparingly.',
    maxLength: 2200,
  },
  {
    id: 'twitter-thread',
    platform: 'twitter',
    type: 'thread',
    systemPrompt: 'Write a Twitter/X thread. Number each tweet (1/N format). Each tweet max 280 characters. Make the first tweet a strong hook.',
    maxLength: 280,
  },
  {
    id: 'youtube-description',
    platform: 'youtube',
    type: 'description',
    systemPrompt: 'Write a YouTube video description. Include SEO keywords in first 2 lines. Add timestamps section. Include links section at bottom.',
    maxLength: 5000,
  },
  {
    id: 'linkedin-article',
    platform: 'linkedin',
    type: 'article',
    systemPrompt: 'Write a professional LinkedIn post. Focus on industry insights and actionable takeaways. Include a clear call-to-action.',
    maxLength: 3000,
  },
]

export function getContentTemplate(platform: string, type: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find(t => t.platform === platform && t.type === type)
}

export function getTemplatesByPlatform(platform: string): ContentTemplate[] {
  return CONTENT_TEMPLATES.filter(t => t.platform === platform)
}

export function fillTemplate(templateText: string, vars: Record<string, string>): string {
  let result = templateText
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}
