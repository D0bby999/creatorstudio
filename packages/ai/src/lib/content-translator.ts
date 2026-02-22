/**
 * Content translation using AI structured output + heuristic fallback
 */

import { generateText, Output } from 'ai'
import { z } from 'zod'
import { resolveModelForTask } from './model-resolver'

// Supported languages
export const SUPPORTED_LANGUAGES = [
  'en',
  'es',
  'fr',
  'de',
  'pt',
  'ja',
  'ko',
  'zh',
  'ar',
  'hi',
  'vi',
] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

// Language names for display
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  ar: 'Arabic',
  hi: 'Hindi',
  vi: 'Vietnamese',
}

// Co-located schema
export const TranslatedContentSchema = z.object({
  translatedContent: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  preservedTokens: z.array(z.string()),
})
export type TranslatedContent = z.infer<typeof TranslatedContentSchema>

export interface TranslationOptions {
  preserveHashtags?: boolean // default true
  preserveMentions?: boolean // default true
}

/**
 * Translate content to target language using AI
 * Falls back to token preservation without translation when AI unavailable
 */
export async function translateContent(
  content: string,
  targetLang: SupportedLanguage,
  options?: TranslationOptions,
  brandContext?: string
): Promise<TranslatedContent> {
  // Validate target language
  if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
    throw new Error(
      `Unsupported language: ${targetLang}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`
    )
  }

  const opts = {
    preserveHashtags: options?.preserveHashtags ?? true,
    preserveMentions: options?.preserveMentions ?? true,
  }

  // Extract tokens to preserve
  const hashtags = opts.preserveHashtags ? extractHashtags(content) : []
  const mentions = opts.preserveMentions ? extractMentions(content) : []
  const preservedTokens = [...hashtags, ...mentions]

  try {
    const preserveInstructions =
      preservedTokens.length > 0
        ? `\n\nIMPORTANT: Preserve these tokens EXACTLY as-is in the translation:\n${preservedTokens.join(', ')}`
        : ''

    const brandPrompt = brandContext
      ? `\n\nBrand context: ${brandContext}`
      : ''

    const { output } = await generateText({
      model: resolveModelForTask('translate'),
      output: Output.object({ schema: TranslatedContentSchema }),
      prompt: `Translate this content to ${LANGUAGE_NAMES[targetLang]} (${targetLang}).

Original content: "${content}"${preserveInstructions}${brandPrompt}

Translate naturally while maintaining the original meaning and tone.
Do NOT translate hashtags or @mentions - keep them exactly as they appear.
Identify the source language and provide the complete translated content.`,
      temperature: 0.3, // Low temperature for deterministic translation
    })

    // Post-process: ensure preserved tokens are present
    let finalContent = output!.translatedContent

    for (const token of preservedTokens) {
      if (!finalContent.includes(token)) {
        // Try to inject back at reasonable position
        finalContent = `${finalContent} ${token}`
      }
    }

    return {
      ...output!,
      translatedContent: finalContent,
      preservedTokens,
    }
  } catch (error) {
    console.error('Translation error:', error)
    return translateContentHeuristic(content, targetLang, preservedTokens)
  }
}

/**
 * Fallback when AI translation is unavailable
 * Returns original content with preserved tokens noted
 */
export function translateContentHeuristic(
  content: string,
  targetLang: SupportedLanguage,
  preservedTokens: string[]
): TranslatedContent {
  return {
    translatedContent: content, // No actual translation without AI
    sourceLanguage: 'en', // Assume English source
    targetLanguage: LANGUAGE_NAMES[targetLang],
    preservedTokens,
  }
}

/**
 * Extract hashtags from content
 */
function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\w\u0080-\uFFFF]+/g)
  return matches ? matches : []
}

/**
 * Extract mentions from content
 */
function extractMentions(content: string): string[] {
  const matches = content.match(/@[\w\u0080-\uFFFF]+/g)
  return matches ? matches : []
}

/**
 * Detect language (simple heuristic)
 */
export function detectLanguage(content: string): string {
  // Simple character-based detection
  if (/[\u4e00-\u9fff]/.test(content)) return 'zh'
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(content)) return 'ja'
  if (/[\uac00-\ud7af]/.test(content)) return 'ko'
  if (/[\u0600-\u06ff]/.test(content)) return 'ar'
  if (/[\u0900-\u097f]/.test(content)) return 'hi'

  // Default to English
  return 'en'
}
