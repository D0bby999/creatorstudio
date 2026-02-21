/**
 * Stealth & Anti-Bot module exports
 */

export { ProxyRotator } from './proxy-rotator.js'
export { UserAgentPool } from './user-agent-pool.js'
export { getStealthHeaders, getStealthHeadersFromFingerprint } from './stealth-headers.js'
export { detectCaptcha } from './captcha-detector.js'
export { detectCloudflare } from './cloudflare-detector.js'
export { SessionPool } from './session-pool.js'
export { FingerprintManager } from './fingerprint-manager.js'
export type { FingerprintOptions, GeneratedFingerprint } from './fingerprint-manager.js'
