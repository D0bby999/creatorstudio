/**
 * Detect Cloudflare protection (challenge vs block vs normal response)
 */

import type { CloudflareDetection } from '../types/crawler-types.js'

export function detectCloudflare(
  html: string,
  statusCode: number,
  headers: Record<string, string>
): CloudflareDetection {
  const lowerHtml = html.toLowerCase()

  // Check for cf-ray header (indicates Cloudflare)
  const cfRay = headers['cf-ray'] || headers['CF-Ray']

  // Not behind Cloudflare
  if (!cfRay && !lowerHtml.includes('cloudflare')) {
    return {
      detected: false,
      type: 'none',
    }
  }

  // Check for challenge page
  if (
    statusCode === 403 &&
    (lowerHtml.includes('checking your browser') ||
      lowerHtml.includes('just a moment') ||
      lowerHtml.includes('__cf_chl_jschl_tk__') ||
      lowerHtml.includes('cf-challenge-running'))
  ) {
    return {
      detected: true,
      type: 'challenge',
      cfRay,
    }
  }

  // Check for block page
  if (
    (statusCode === 403 || statusCode === 503) &&
    (lowerHtml.includes('access denied') ||
      lowerHtml.includes('blocked') ||
      lowerHtml.includes('ray id'))
  ) {
    return {
      detected: true,
      type: 'block',
      cfRay,
    }
  }

  // Behind Cloudflare but no challenge/block
  return {
    detected: false,
    type: 'none',
    cfRay,
  }
}
