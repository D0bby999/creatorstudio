import * as cheerio from 'cheerio'
import type { FacebookPost } from './facebook-types.js'
import { resolveRelativeUrl } from './facebook-url-utils.js'
import { parseRelativeTimestamp, parseNumericCount } from './facebook-parse-utils.js'

const POST_SELECTORS = [
  'article[data-ft]',
  'div[data-ft]',
  'article[id^="u_"]',
  'div.bx > div.by',
  '#structured_composer_async_container > div > div > div',
]

const TEXT_SELECTORS = [
  'div[data-ft] > div > div > span',
  'div[data-ft] > div > span',
  '.story_body_container span',
  'p',
]

const TIMESTAMP_SELECTORS = ['abbr', 'span[data-sigil="timestamp"]', 'a > abbr']

export function parsePostsFromHtml(html: string, pageId: string): FacebookPost[] {
  const $ = cheerio.load(html)
  const posts: FacebookPost[] = []

  let postElements: cheerio.Cheerio<any> | null = null
  for (const selector of POST_SELECTORS) {
    const found = $(selector)
    if (found.length > 0) {
      postElements = found
      break
    }
  }

  if (!postElements) return posts

  postElements.each((_i: number, elem: any) => {
    const post = parsePostElement($, elem, pageId)
    if (post) posts.push(post)
  })

  return posts
}

function parsePostElement(
  $: cheerio.CheerioAPI,
  elem: any,
  pageId: string
): FacebookPost | null {
  const $el = $(elem)

  const text = extractText($, $el)
  if (!text && $el.find('img').length === 0) return null

  const postId = extractPostId($, $el) || `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const timestampRaw = extractTimestampRaw($, $el)

  return {
    postId,
    permalink: extractPermalink($, $el, pageId),
    text,
    author: extractAuthor($, $el),
    authorUrl: extractAuthorUrl($, $el),
    timestamp: parseRelativeTimestamp(timestampRaw),
    timestampRaw,
    images: extractImages($, $el),
    videos: extractVideos($, $el),
    reactions: extractReactionCount($, $el),
    comments: extractCommentCount($, $el),
    shares: null,
    scrapedAt: new Date(),
    source: 'mbasic',
  }
}

function extractText($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  for (const selector of TEXT_SELECTORS) {
    const found = $el.find(selector).first()
    if (found.length) {
      const text = found.text().trim()
      if (text) return text
    }
  }
  const directText = $el.clone().children('header, footer').remove().end().text().trim()
  return directText.slice(0, 5000)
}

function extractPostId($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | null {
  const dataFt = $el.attr('data-ft')
  if (dataFt) {
    try {
      const parsed = JSON.parse(dataFt)
      if (parsed.top_level_post_id) return parsed.top_level_post_id
      if (parsed.tl_objid) return parsed.tl_objid
    } catch { /* ignore parse errors */ }
  }
  const id = $el.attr('id')
  if (id) return id
  const link = $el.find('a[href*="/story.php"], a[href*="/posts/"]').attr('href')
  if (link) {
    const match = link.match(/(?:story_fbid=|\/posts\/)(\d+)/)
    if (match) return match[1]
  }
  return null
}

function extractAuthor($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  return $el.find('h3 a, strong a').first().text().trim() || 'Unknown'
}

function extractAuthorUrl($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string | null {
  const link = $el.find('h3 a, strong a').first().attr('href')
  return link ? resolveRelativeUrl(link) : null
}

function extractTimestampRaw($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string {
  for (const selector of TIMESTAMP_SELECTORS) {
    const found = $el.find(selector).first()
    if (found.length) {
      const text = found.text().trim()
      if (text) return text
    }
  }
  return ''
}

function extractImages($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): string[] {
  const images: string[] = []
  $el.find('img[src]').each((_i: number, img: any) => {
    const src = $(img).attr('src') || ''
    if (src && !src.includes('emoji') && !src.includes('rsrc.php') && src.includes('scontent')) {
      images.push(src)
    }
  })
  return images
}

function extractVideos(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<any>
): { thumbnailUrl: string; permalink: string }[] {
  const videos: { thumbnailUrl: string; permalink: string }[] = []
  $el.find('a[href*="/video"], a[href*="watch"]').each((_i: number, link: any) => {
    const href = $(link).attr('href') || ''
    const thumb = $(link).find('img').attr('src') || ''
    if (href) videos.push({ thumbnailUrl: thumb, permalink: resolveRelativeUrl(href) })
  })
  return videos
}

function extractReactionCount($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): number {
  const reactionLink = $el.find('a[href*="reaction"], a[href*="like"]').first()
  return reactionLink.length ? parseNumericCount(reactionLink.text()) : 0
}

function extractCommentCount($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>): number {
  const commentLink = $el.find('a[href*="comment"]').first()
  return commentLink.length ? parseNumericCount(commentLink.text()) : 0
}

function extractPermalink($: cheerio.CheerioAPI, $el: cheerio.Cheerio<any>, pageId: string): string {
  const link = $el.find('a[href*="/story.php"], a[href*="/posts/"], a[href*="/permalink/"]').attr('href')
  if (link) return resolveRelativeUrl(link)
  return `https://www.facebook.com/${pageId}`
}

export function findNextPageUrl($: cheerio.CheerioAPI): string | null {
  const moreLink = $('a[href*="bacr="], a[href*="sectionLoadingID"]').last()
  if (moreLink.length) {
    const href = moreLink.attr('href')
    if (href) return resolveRelativeUrl(href)
  }
  const showMore = $('div#structured_composer_async_container + div a, a:contains("See more")').last()
  if (showMore.length) {
    const href = showMore.attr('href')
    if (href) return resolveRelativeUrl(href)
  }
  return null
}

// Re-export parse utils for barrel convenience
export { parseRelativeTimestamp, parseNumericCount } from './facebook-parse-utils.js'
