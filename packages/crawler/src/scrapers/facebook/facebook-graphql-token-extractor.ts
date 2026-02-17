import { getStealthHeaders } from '../../stealth/stealth-headers.js'
import { UserAgentPool } from '../../stealth/user-agent-pool.js'
import { withRetry } from '../../lib/retry-handler.js'
import type { FacebookCookies, FacebookGraphQLTokens } from './facebook-types.js'
import { buildCookieHeader } from './facebook-types.js'

const FB_HOME = 'https://www.facebook.com/'

const TOKEN_PATTERNS = {
  fbDtsg: [
    /DTSGInitData.*?"token":"([a-zA-Z0-9:_-]+)"/,
    /"dtsg":\{"token":"([a-zA-Z0-9:_-]+)"/,
    /name="fb_dtsg" value="([a-zA-Z0-9:_-]+)"/,
  ],
  lsd: [
    /LSD.*?\[,\],"([a-zA-Z0-9]+)"/,
    /"lsd"[,:\s]*"([a-zA-Z0-9]+)"/,
    /name="lsd" value="([a-zA-Z0-9]+)"/,
  ],
  jazoest: [
    /jazoest=(\d+)/,
    /name="jazoest" value="(\d+)"/,
  ],
}

export async function extractGraphQLTokens(cookies: FacebookCookies): Promise<FacebookGraphQLTokens> {
  const userAgentPool = new UserAgentPool()
  const headers: Record<string, string> = {
    ...getStealthHeaders(FB_HOME),
    'User-Agent': userAgentPool.getAgent({ deviceType: 'desktop' }),
    Cookie: buildCookieHeader(cookies),
  }

  const html = await withRetry(
    async () => {
      const response = await fetch(FB_HOME, {
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch Facebook homepage: HTTP ${response.status}`)
      }
      return response.text()
    },
    2,
    3000
  )

  const fbDtsg = extractToken(html, TOKEN_PATTERNS.fbDtsg, 'fb_dtsg')
  const lsd = extractToken(html, TOKEN_PATTERNS.lsd, 'lsd')
  const jazoest = extractToken(html, TOKEN_PATTERNS.jazoest, 'jazoest')

  return {
    fbDtsg,
    lsd,
    jazoest,
    userId: cookies.c_user,
  }
}

function extractToken(html: string, patterns: RegExp[], name: string): string {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  throw new Error(`Could not extract ${name} token — Facebook page structure may have changed`)
}
