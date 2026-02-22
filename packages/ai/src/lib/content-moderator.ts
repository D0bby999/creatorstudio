/**
 * Content moderation using AI structured output + heuristic fallback
 */

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

// Schemas
export const ModerationIssueSchema = z.object({
  category: z.enum(['brand-safety', 'policy', 'accessibility', 'sensitivity']),
  severity: z.enum(['warning', 'error']),
  description: z.string(),
})

export const ModerationReportSchema = z.object({
  safe: z.boolean(),
  overallRisk: z.enum(['low', 'medium', 'high']),
  issues: z.array(ModerationIssueSchema),
  suggestions: z.array(z.string()),
})
export type ModerationReport = z.infer<typeof ModerationReportSchema>

export const DEFAULT_SENSITIVITY = 'moderate' as const
export type Sensitivity = 'strict' | 'moderate' | 'relaxed'

export interface ModerationOptions {
  sensitivity?: Sensitivity
}

/**
 * Moderate content using AI structured output
 * Falls back to heuristic analysis when AI is unavailable
 */
export async function moderateContent(
  content: string,
  platform: string,
  options?: ModerationOptions
): Promise<ModerationReport> {
  const sensitivity = options?.sensitivity || DEFAULT_SENSITIVITY

  try {
    const promptPrefix = getSensitivityPrompt(sensitivity)

    const { output } = await generateText({
      model: resolveModelForTask('moderation'),
      output: Output.object({ schema: ModerationReportSchema }),
      prompt: `${promptPrefix}

Moderate this ${platform} post for brand safety, policy compliance, accessibility, and sensitive content.

Content: "${content}"

Evaluate:
- Brand safety issues (spam language, clickbait, deceptive practices)
- Platform policy violations (hate speech, harassment, misinformation)
- Accessibility concerns (missing alt text context, readability)
- Sensitive topics (politics, religion, controversial subjects)

Provide safe status, overall risk level, specific issues with categories and severity, and actionable suggestions.`,
      temperature: 0.3,
    })

    // Post-process: ensure high risk if any error-level issues
    const hasErrorIssues = output!.issues.some(issue => issue.severity === 'error')
    if (hasErrorIssues && output!.overallRisk !== 'high') {
      output!.overallRisk = 'high'
    }

    return output!
  } catch (error) {
    console.error('Content moderation error:', error)
    return moderateContentHeuristic(content, platform)
  }
}

/**
 * Get sensitivity-specific prompt prefix
 */
function getSensitivityPrompt(sensitivity: Sensitivity): string {
  switch (sensitivity) {
    case 'strict':
      return 'Flag everything potentially concerning. Be extremely cautious and conservative.'
    case 'moderate':
      return 'Flag clear violations, note edge cases as warnings. Balance safety with practicality.'
    case 'relaxed':
      return 'Only flag obvious violations. Allow borderline content to pass with warnings.'
  }
}

/**
 * Fallback heuristic moderation when AI is unavailable
 */
export function moderateContentHeuristic(content: string, platform: string): ModerationReport {
  const issues: z.infer<typeof ModerationIssueSchema>[] = []
  const suggestions: string[] = []

  // ALL CAPS check (>50% uppercase)
  const uppercaseCount = (content.match(/[A-Z]/g) || []).length
  const letterCount = (content.match(/[a-zA-Z]/g) || []).length
  if (letterCount > 0 && uppercaseCount / letterCount > 0.5) {
    issues.push({
      category: 'brand-safety',
      severity: 'warning',
      description: 'Excessive use of capital letters (appears shouting/spammy)',
    })
    suggestions.push('Use normal capitalization for better readability')
  }

  // Excessive punctuation check
  if (/[!?]{3,}/.test(content)) {
    issues.push({
      category: 'brand-safety',
      severity: 'warning',
      description: 'Excessive punctuation detected',
    })
    suggestions.push('Reduce consecutive punctuation marks for professional tone')
  }

  // Very short content check
  if (content.trim().length < 10) {
    issues.push({
      category: 'accessibility',
      severity: 'warning',
      description: 'Content is very short and may lack context',
    })
    suggestions.push('Add more descriptive content for better engagement')
  }

  // Basic keyword blocklist
  const spamKeywords = ['buy now', 'limited time', 'act fast', 'click here', 'free money', 'guaranteed', 'urgent', '100% free', 'no risk', 'make money fast']
  const lowerContent = content.toLowerCase()
  const foundSpamKeywords = spamKeywords.filter(keyword => lowerContent.includes(keyword))
  if (foundSpamKeywords.length > 0) {
    issues.push({
      category: 'brand-safety',
      severity: 'warning',
      description: `Spam-like language detected: ${foundSpamKeywords.join(', ')}`,
    })
    suggestions.push('Avoid overly promotional language for better trust')
  }

  // Missing hashtags on visual platforms
  const hashtagCount = (content.match(/#\w+/g) || []).length
  if ((platform === 'instagram' || platform === 'tiktok') && hashtagCount === 0) {
    issues.push({
      category: 'accessibility',
      severity: 'warning',
      description: `${platform} posts typically benefit from hashtags for discoverability`,
    })
    suggestions.push(`Add 3-5 relevant hashtags for better reach on ${platform}`)
  }

  // Determine overall risk
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const overallRisk = errorCount > 0 ? 'high' : warningCount >= 3 ? 'medium' : 'low'

  return {
    safe: errorCount === 0,
    overallRisk,
    issues,
    suggestions,
  }
}

/**
 * Helper to determine if content should be auto-rejected
 */
export function shouldAutoReject(report: ModerationReport): boolean {
  return report.overallRisk === 'high' && report.issues.some(issue => issue.severity === 'error')
}
