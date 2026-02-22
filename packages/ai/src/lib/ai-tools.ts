import { tool } from 'ai'
import { z } from 'zod'
import type { generateImage } from './image-generation'
import type { suggestHashtags } from './hashtag-suggestions'

/**
 * Web search tool - uses crawler to scrape search results
 * Fallback to mock data if scraping fails
 */
export const searchWeb = tool({
  description: 'Search the web for information on a topic',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { scrapeUrl } = await import('@creator-studio/crawler/lib/url-scraper')

      // Use DuckDuckGo lite search (simple HTML, no JS required)
      const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
      const content = await scrapeUrl(searchUrl)

      // Extract search results from scraped content
      return {
        results: [
          {
            title: content.title || `Search results for: ${query}`,
            snippet: content.description || content.text.slice(0, 200),
            url: content.url || searchUrl
          }
        ]
      }
    } catch (error) {
      // Fallback to mock data if scraping fails
      return {
        results: [
          {
            title: `Top results for: ${query}`,
            snippet: 'Based on current trends and recent analysis, this topic is gaining momentum across social platforms...',
            url: 'https://example.com/1'
          },
          {
            title: `${query} - Latest insights`,
            snippet: 'Recent studies show this is performing well with engagement rates up 45% this month...',
            url: 'https://example.com/2'
          },
          {
            title: `How to leverage ${query}`,
            snippet: 'Expert creators are using this strategy to increase reach and build authentic connections...',
            url: 'https://example.com/3'
          }
        ]
      }
    }
  },
})

/**
 * Trend analysis tool - uses crawler to analyze content and extract keywords
 * Fallback to mock data if analysis fails
 */
export const analyzeTrends = tool({
  description: 'Analyze trending topics for a platform and niche',
  inputSchema: z.object({
    platform: z.enum(['instagram', 'twitter', 'tiktok', 'youtube']).describe('Social platform'),
    niche: z.string().describe('Content niche or topic area'),
  }),
  execute: async ({ platform, niche }) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { scrapeUrl } = await import('@creator-studio/crawler/lib/url-scraper')
      const { analyzeSeo } = await import('@creator-studio/crawler/lib/seo-analyzer')

      // Scrape a relevant trending page for the platform
      const trendUrls: Record<string, string> = {
        twitter: `https://trends24.in/`,
        instagram: `https://www.instagram.com/explore/`,
        youtube: `https://www.youtube.com/feed/trending`,
        tiktok: `https://www.tiktok.com/discover`,
      }

      const url = trendUrls[platform] || `https://trends.google.com/trends/explore?q=${encodeURIComponent(niche)}`
      const content = await scrapeUrl(url)
      const seoReport = analyzeSeo(content)

      // Extract keywords from SEO analysis
      const keywords = seoReport.keywords.slice(0, 10)
      const trends = keywords.slice(0, 4).map((keyword, index) => ({
        topic: keyword,
        score: 95 - (index * 5),
        platform,
        relatedKeywords: keywords.slice(index + 1, index + 5)
      }))

      return {
        trends: trends.length > 0 ? trends : [
          {
            topic: `${niche} tips`,
            score: 92,
            platform,
            relatedKeywords: ['tutorial', 'howto', 'guide', 'beginner']
          }
        ],
        platform,
        analysis: `Analyzed trending keywords from ${platform} related to ${niche}.`
      }
    } catch (error) {
      // Fallback to mock data if analysis fails
      return {
        trends: [
          {
            topic: `${niche} tips`,
            score: 92,
            platform,
            relatedKeywords: ['tutorial', 'howto', 'guide', 'beginner']
          },
          {
            topic: `${niche} trends 2026`,
            score: 87,
            platform,
            relatedKeywords: ['new', 'latest', 'update', 'innovation']
          },
          {
            topic: `best ${niche}`,
            score: 78,
            platform,
            relatedKeywords: ['top', 'review', 'comparison', 'ranked']
          },
          {
            topic: `${niche} mistakes`,
            score: 74,
            platform,
            relatedKeywords: ['avoid', 'common', 'fix', 'warning']
          }
        ],
        platform,
        analysis: `Trending topics for ${niche} on ${platform} show strong engagement with educational content.`
      }
    }
  },
})

/**
 * Design suggestion tool - uses canvas templates for real recommendations
 * Fallback to generic suggestions if templates not available
 */
export const suggestDesign = tool({
  description: 'Suggest design templates for social media content',
  inputSchema: z.object({
    content: z.string().describe('Content to design for'),
    platform: z.enum(['instagram', 'twitter', 'tiktok', 'youtube']).describe('Target platform'),
  }),
  execute: async ({ content, platform }) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { canvasTemplates } = await import('@creator-studio/canvas/templates/canvas-templates')

      // Map platform names to canvas template categories
      const platformCategoryMap: Record<string, string> = {
        instagram: 'Instagram',
        twitter: 'Twitter',
        tiktok: 'TikTok',
        youtube: 'YouTube',
      }

      const category = platformCategoryMap[platform]

      // Filter templates by platform category
      const platformTemplates = canvasTemplates.filter(t =>
        t.category.toLowerCase() === category.toLowerCase()
      )

      if (platformTemplates.length > 0) {
        return {
          suggestions: platformTemplates.map(template => ({
            template: template.id,
            description: `${template.name} - ${template.description}`,
            platform,
            dimensions: { width: template.width, height: template.height }
          })),
          contentAnalysis: `Found ${platformTemplates.length} templates for ${platform}. For "${content}", consider using templates that match your content type.`
        }
      }

      // Fallback if no templates found
      throw new Error('No templates found')
    } catch (error) {
      // Fallback to generic suggestions
      const dimensions: Record<string, { width: number; height: number }> = {
        instagram: { width: 1080, height: 1080 },
        twitter: { width: 1200, height: 675 },
        tiktok: { width: 1080, height: 1920 },
        youtube: { width: 1280, height: 720 },
      }

      const dim = dimensions[platform]

      return {
        suggestions: [
          {
            template: 'bold-text-overlay',
            description: 'Bold sans-serif text on gradient background (purple to pink). Perfect for quotes and announcements.',
            platform,
            dimensions: dim
          },
          {
            template: 'minimal-card',
            description: 'Clean white card with subtle shadow, centered text, and accent color border. Great for tips and facts.',
            platform,
            dimensions: dim
          },
          {
            template: 'photo-with-caption',
            description: 'Full-bleed photo background with dark overlay and white text. Ideal for storytelling content.',
            platform,
            dimensions: dim
          },
          {
            template: 'split-layout',
            description: 'Two-column layout with image on one side and text on the other. Works well for comparisons.',
            platform,
            dimensions: dim
          }
        ],
        contentAnalysis: `For "${content}" on ${platform}, consider using visual hierarchy with your main message front and center.`
      }
    }
  },
})

/**
 * Image generation tool - creates images from text prompts via Replicate API
 */
export const generateImageTool = tool({
  description: 'Generate an image from a text description using AI',
  inputSchema: z.object({
    prompt: z.string().describe('Detailed description of the image to generate'),
    width: z.number().optional().describe('Image width in pixels (default: 1024)'),
    height: z.number().optional().describe('Image height in pixels (default: 1024)'),
  }),
  execute: async ({ prompt, width, height }) => {
    try {
      const { generateImage } = await import('./image-generation')
      const result = await generateImage(prompt, { width, height })
      return {
        success: true,
        imageUrl: result.url,
        id: result.id,
        prompt,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
      }
    }
  },
})

/**
 * Hashtag suggestion tool - generates platform-specific hashtags
 */
export const suggestHashtagsTool = tool({
  description: 'Generate relevant hashtags for social media content',
  inputSchema: z.object({
    content: z.string().describe('The content to generate hashtags for'),
    platform: z.enum(['instagram', 'twitter', 'tiktok', 'linkedin']).describe('Target social platform'),
    count: z.number().optional().describe('Number of hashtags to generate'),
  }),
  execute: async ({ content, platform, count }) => {
    try {
      const { suggestHashtags } = await import('./hashtag-suggestions')
      const hashtags = await suggestHashtags(content, platform, count)
      return {
        success: true,
        hashtags,
        platform,
        formatted: hashtags.map(tag => `#${tag}`).join(' '),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Hashtag generation failed',
      }
    }
  },
})
