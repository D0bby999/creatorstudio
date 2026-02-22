/**
 * Prompt injection detection and sanitization
 * Detects jailbreak attempts, role hijacking, prompt leaking, and encoding tricks
 */

import { randomBytes } from 'crypto'

export type InjectionCategory = 'jailbreak' | 'role-hijack' | 'prompt-leak' | 'encoding-trick'
export type Severity = 'low' | 'medium' | 'high'

export interface InjectionFlag {
  pattern: string
  category: InjectionCategory
  severity: Severity
  matched: string
}

export interface SanitizationResult {
  sanitized: string
  flags: InjectionFlag[]
  isClean: boolean
}

interface InjectionPattern {
  regex: RegExp
  category: InjectionCategory
  severity: Severity
  description: string
}

/** Injection patterns with severity classification */
const INJECTION_PATTERNS: InjectionPattern[] = [
  // Jailbreak attempts (high severity)
  {
    regex: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|prompts)/i,
    category: 'jailbreak',
    severity: 'high',
    description: 'Ignore previous instructions',
  },
  {
    regex: /you\s+are\s+now\s+(DAN|a\s+new|an?\s+unrestricted)/i,
    category: 'jailbreak',
    severity: 'high',
    description: 'Role redefinition attempt',
  },
  {
    regex: /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|rules|context)/i,
    category: 'jailbreak',
    severity: 'high',
    description: 'Context reset attempt',
  },
  {
    regex: /disregard\s+(all\s+)?(previous|prior|above|your)\s+(instructions|rules|programming)/i,
    category: 'jailbreak',
    severity: 'high',
    description: 'Disregard instructions',
  },
  // Role hijacking (medium severity)
  {
    regex: /\b(system|assistant)\s*:/i,
    category: 'role-hijack',
    severity: 'medium',
    description: 'Fake role marker',
  },
  {
    regex: /\[(SYSTEM|INST)\]\s*:?\s*/i,
    category: 'role-hijack',
    severity: 'medium',
    description: 'System/instruction tag injection',
  },
  {
    regex: /<\|?(system|assistant|im_start)\|?>/i,
    category: 'role-hijack',
    severity: 'medium',
    description: 'Chat template injection',
  },
  // Prompt leaking (medium/low severity)
  {
    regex: /(repeat|show|reveal|display|print)\b.{0,20}\b(instructions|prompt|rules)\b/i,
    category: 'prompt-leak',
    severity: 'medium',
    description: 'Prompt extraction attempt',
  },
  {
    regex: /what\s+(are|is)\s+your\s+(system\s+)?(prompt|instructions|rules)/i,
    category: 'prompt-leak',
    severity: 'low',
    description: 'Prompt information request',
  },
  {
    regex: /(output|display|show)\s+(your\s+)?(initial|original|system)\s+(prompt|instructions)/i,
    category: 'prompt-leak',
    severity: 'medium',
    description: 'Initial prompt extraction',
  },
  // Encoding tricks (medium severity)
  {
    regex: /base64|atob|btoa|eval\s*\(/i,
    category: 'encoding-trick',
    severity: 'medium',
    description: 'Encoding/eval function usage',
  },
  {
    regex: /\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|&#x?[0-9]+;/i,
    category: 'encoding-trick',
    severity: 'medium',
    description: 'Hex/unicode escape sequences',
  },
]

const MAX_INPUT_LENGTH = 10_000

/** Detect injection patterns in user input */
export function detectInjectionPatterns(input: string): InjectionFlag[] {
  // Cap input length to prevent DoS
  const capped = input.slice(0, MAX_INPUT_LENGTH)
  const flags: InjectionFlag[] = []

  for (const pattern of INJECTION_PATTERNS) {
    const match = capped.match(pattern.regex)
    if (match) {
      flags.push({
        pattern: pattern.description,
        category: pattern.category,
        severity: pattern.severity,
        matched: match[0],
      })
    }
  }

  return flags
}

/** Wrap user input with unique delimiters to prevent context confusion */
export function wrapWithDelimiters(input: string): { wrapped: string; startToken: string; endToken: string } {
  const token = randomBytes(4).toString('hex')
  const startToken = `[USER_INPUT_${token}]`
  const endToken = `[/USER_INPUT_${token}]`
  return {
    wrapped: `${startToken}\n${input}\n${endToken}`,
    startToken,
    endToken,
  }
}

/** Strip fake role markers from user input */
function stripRoleMarkers(input: string): string {
  // Remove standalone role markers (case-insensitive)
  // Only strip when used as fake role prefixes (at start of line or after newline)
  let cleaned = input
    .replace(/(^|\n)\s*(system|assistant)\s*:\s*/gi, '$1')
    .replace(/\[(SYSTEM|INST)\]\s*:?\s*/gi, '')
    .replace(/<\|?(system|assistant|im_start)\|?>/gi, '')

  return cleaned.trim()
}

/** Sanitize user input and detect injection attempts */
export function sanitizeUserInput(input: string): SanitizationResult {
  const flags = detectInjectionPatterns(input)
  const sanitized = stripRoleMarkers(input)

  return {
    sanitized,
    flags,
    isClean: flags.length === 0,
  }
}
