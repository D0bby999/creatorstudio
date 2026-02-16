/**
 * Detect CAPTCHA challenges in HTML responses
 * Detection only, not solving
 */

import type { CaptchaDetection } from '../types/crawler-types.js'

export function detectCaptcha(html: string): CaptchaDetection {
  const lowerHtml = html.toLowerCase()

  // Check for reCAPTCHA
  if (
    lowerHtml.includes('recaptcha') ||
    lowerHtml.includes('g-recaptcha') ||
    lowerHtml.includes('google.com/recaptcha')
  ) {
    return {
      detected: true,
      type: 'recaptcha',
      confidence: 0.95,
    }
  }

  // Check for hCaptcha
  if (
    lowerHtml.includes('hcaptcha') ||
    lowerHtml.includes('h-captcha') ||
    lowerHtml.includes('hcaptcha.com')
  ) {
    return {
      detected: true,
      type: 'hcaptcha',
      confidence: 0.95,
    }
  }

  // Check for Cloudflare Turnstile
  if (
    lowerHtml.includes('turnstile') ||
    lowerHtml.includes('cf-turnstile') ||
    lowerHtml.includes('challenges.cloudflare.com/turnstile')
  ) {
    return {
      detected: true,
      type: 'turnstile',
      confidence: 0.95,
    }
  }

  // Generic CAPTCHA indicators (lower confidence)
  if (lowerHtml.includes('captcha') || lowerHtml.includes('challenge')) {
    return {
      detected: true,
      type: 'unknown',
      confidence: 0.5,
    }
  }

  return {
    detected: false,
    confidence: 0,
  }
}
