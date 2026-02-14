// Re-export shared SSRF utility for backward compatibility
export {
  isPrivateIP,
  resolveAndValidateUrl,
  validateServerFetchUrl,
} from '@creator-studio/utils/ssrf-validator'

// Re-export isAllowedUrl as a convenience wrapper
import { isPrivateIP } from '@creator-studio/utils/ssrf-validator'

export function isAllowedUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    if (url.protocol !== 'https:') return false
    if (isPrivateIP(url.hostname)) return false
    return true
  } catch {
    return false
  }
}
