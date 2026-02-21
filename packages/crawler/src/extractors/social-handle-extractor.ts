/**
 * Extract social media handles from HTML for 8 platforms
 * Port of Crawlee production-grade regexes with negative lookbehind/ahead
 * Supports mailto/tel links (certain) + text patterns (uncertain)
 */

import * as cheerio from 'cheerio'

const INSTAGRAM_RE = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/(?!explore|_n|_u|p\/|reel\/|stories\/|accounts\/|developer\/|about\/|legal\/|api\/)([a-zA-Z0-9_.]{1,30})\/?/gi

const TWITTER_RE = /(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/(?!oauth|account|tos|privacy|signup|home|hashtag|search|login|widgets|i|settings|start|share|intent|messages|explore|notifications|jobs|compose)@?([a-zA-Z0-9_]{1,15})\/?/gi

const FACEBOOK_RE = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.com)\/(?!rsrc\.php|apps|groups|events|l\.php|friends|images|photo\.php|chat|ajax|dyi|common|policies|login|sharer|share|watch|marketplace|gaming)([a-zA-Z0-9.\-]{5,51})\/?/gi

const YOUTUBE_RE = /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)([a-zA-Z0-9\-_]{2,100})\/?/gi

const TIKTOK_RE = /(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([a-zA-Z0-9._]{2,24})\/?/gi

const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(in|company)\/([a-zA-Z0-9_\-]{3,100})\/?/gi

const PINTEREST_RE = /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]{3,30})\/?/gi

const DISCORD_RE = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9]{2,32})\/?/gi

const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g

const PHONE_RE = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g

export interface SocialHandles {
  instagram: string[]
  twitter: string[]
  facebook: string[]
  youtube: string[]
  tiktok: string[]
  linkedin: string[]
  pinterest: string[]
  discord: string[]
  emails: { certain: string[]; uncertain: string[] }
  phones: { certain: string[]; uncertain: string[] }
}

export class SocialHandleExtractor {
  extract(html: string): SocialHandles {
    const $ = cheerio.load(html)

    // Certain emails/phones from mailto:/tel: links
    const certainEmails = new Set<string>()
    const certainPhones = new Set<string>()

    $('a[href^="mailto:"]').each((_, el) => {
      const email = $(el).attr('href')?.replace('mailto:', '').split('?')[0]
      if (email) certainEmails.add(email.toLowerCase())
    })

    $('a[href^="tel:"]').each((_, el) => {
      const phone = $(el).attr('href')?.replace('tel:', '').replace(/\D/g, '')
      if (phone && phone.length >= 7) certainPhones.add(phone)
    })

    // Text-based extraction (uncertain)
    const text = $.text()
    const uncertainEmails = this.extractMatches(text, EMAIL_RE)
      .map((e) => e.toLowerCase())
      .filter((e) => !certainEmails.has(e))
    const uncertainPhones = this.extractPhones(text).filter(
      (p) => !certainPhones.has(p)
    )

    return {
      instagram: this.extractHandles(html, INSTAGRAM_RE),
      twitter: this.extractHandles(html, TWITTER_RE),
      facebook: this.extractHandles(html, FACEBOOK_RE),
      youtube: this.extractHandles(html, YOUTUBE_RE),
      tiktok: this.extractHandles(html, TIKTOK_RE),
      linkedin: this.extractLinkedIn(html),
      pinterest: this.extractHandles(html, PINTEREST_RE),
      discord: this.extractHandles(html, DISCORD_RE),
      emails: {
        certain: [...certainEmails].sort(),
        uncertain: this.dedupe(uncertainEmails),
      },
      phones: {
        certain: [...certainPhones].sort(),
        uncertain: this.dedupe(uncertainPhones),
      },
    }
  }

  private extractHandles(html: string, regex: RegExp): string[] {
    const matches: string[] = []
    let match: RegExpExecArray | null
    const re = new RegExp(regex.source, regex.flags)
    while ((match = re.exec(html)) !== null) {
      if (match[1]) matches.push(match[1].toLowerCase())
    }
    return this.dedupe(matches)
  }

  private extractLinkedIn(html: string): string[] {
    const matches: string[] = []
    let match: RegExpExecArray | null
    const re = new RegExp(LINKEDIN_RE.source, LINKEDIN_RE.flags)
    while ((match = re.exec(html)) !== null) {
      if (match[1] && match[2]) {
        matches.push(`${match[1]}/${match[2]}`.toLowerCase())
      }
    }
    return this.dedupe(matches)
  }

  private extractMatches(text: string, regex: RegExp): string[] {
    const re = new RegExp(regex.source, regex.flags)
    const matches: string[] = []
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      matches.push(match[0])
    }
    return matches
  }

  private extractPhones(text: string): string[] {
    const re = new RegExp(PHONE_RE.source, PHONE_RE.flags)
    const matches: string[] = []
    let match: RegExpExecArray | null
    while ((match = re.exec(text)) !== null) {
      const digits = match[0].replace(/\D/g, '')
      if (digits.length >= 7 && !this.isDateLike(digits)) {
        matches.push(digits)
      }
    }
    return matches
  }

  private isDateLike(num: string): boolean {
    return /^(19|20)\d{6}$/.test(num)
  }

  private dedupe(arr: string[]): string[] {
    return [...new Set(arr)].sort()
  }
}
