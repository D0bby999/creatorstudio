import type { ScrapedContent, SeoReport } from '../types/crawler-types'

/**
 * Analyzes scraped content and generates SEO report
 */
export function analyzeSeo(content: ScrapedContent): SeoReport {
  const issues: string[] = []
  let score = 100

  // Analyze title
  const titleLength = content.title.length
  const titleOptimal = titleLength >= 30 && titleLength <= 60
  if (titleLength === 0) {
    issues.push('Missing page title')
    score -= 20
  } else if (titleLength < 30) {
    issues.push('Title too short (should be 30-60 characters)')
    score -= 10
  } else if (titleLength > 60) {
    issues.push('Title too long (should be 30-60 characters)')
    score -= 5
  }

  // Analyze description
  const descLength = content.description.length
  const descOptimal = descLength >= 120 && descLength <= 160
  if (descLength === 0) {
    issues.push('Missing meta description')
    score -= 15
  } else if (descLength < 120) {
    issues.push('Description too short (should be 120-160 characters)')
    score -= 8
  } else if (descLength > 160) {
    issues.push('Description too long (should be 120-160 characters)')
    score -= 5
  }

  // Analyze headings
  const h1Count = content.headings.filter(h =>
    content.text.includes(h) && h.length > 0
  ).length
  const h2Count = Math.max(0, content.headings.length - h1Count)
  const h3Count = 0 // simplified - cheerio already extracts all headings
  const hasH1 = h1Count > 0

  if (!hasH1) {
    issues.push('Missing H1 heading')
    score -= 15
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings found (should be only one)')
    score -= 5
  }

  if (h2Count === 0) {
    issues.push('No H2 headings found (helps structure content)')
    score -= 5
  }

  // Analyze images
  const totalImages = content.images.length
  let withAlt = 0
  let missingAlt = totalImages

  // Check meta for image alt info (simplified - real impl would parse HTML)
  if (content.meta['og:image']) {
    withAlt = Math.min(1, totalImages)
    missingAlt = Math.max(0, totalImages - 1)
  }

  if (totalImages > 0 && missingAlt === totalImages) {
    issues.push('Images missing alt text (important for accessibility)')
    score -= 10
  } else if (missingAlt > 0) {
    issues.push(`${missingAlt} images missing alt text`)
    score -= 5
  }

  // Extract keywords (top 10 most common words > 4 chars)
  const words = content.text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4)

  const wordCounts: Record<string, number> = {}
  words.forEach(w => {
    wordCounts[w] = (wordCounts[w] || 0) + 1
  })

  const keywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  // Check meta tags
  const requiredMeta = ['og:title', 'og:description', 'og:image', 'og:url']
  const missingMeta = requiredMeta.filter(tag => !content.meta[tag])

  if (missingMeta.length > 0) {
    issues.push(`Missing Open Graph tags: ${missingMeta.join(', ')}`)
    score -= missingMeta.length * 3
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))

  return {
    url: content.url,
    score,
    title: {
      value: content.title,
      length: titleLength,
      optimal: titleOptimal
    },
    description: {
      value: content.description,
      length: descLength,
      optimal: descOptimal
    },
    headings: {
      h1Count,
      h2Count,
      h3Count,
      hasH1
    },
    images: {
      total: totalImages,
      withAlt,
      missingAlt
    },
    keywords,
    issues,
    analyzedAt: new Date().toISOString()
  }
}
