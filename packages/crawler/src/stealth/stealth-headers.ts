/**
 * Generate realistic browser headers with variance to avoid fingerprinting
 */

export function getStealthHeaders(url: string): Record<string, string> {
  const urlObj = new URL(url)
  const isHttps = urlObj.protocol === 'https:'

  // Base headers all browsers send
  const headers: Record<string, string> = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'max-age=0',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  }

  // Add Sec-Fetch headers (modern browsers)
  headers['Sec-Fetch-Dest'] = 'document'
  headers['Sec-Fetch-Mode'] = 'navigate'
  headers['Sec-Fetch-Site'] = 'none'
  headers['Sec-Fetch-User'] = '?1'

  // Add Sec-Ch-Ua headers (Chromium-based browsers)
  const chromeVersion = 130 + Math.floor(Math.random() * 2) // 130 or 131
  headers['Sec-Ch-Ua'] = `"Chromium";v="${chromeVersion}", "Not(A:Brand";v="99", "Google Chrome";v="${chromeVersion}"`
  headers['Sec-Ch-Ua-Mobile'] = '?0'
  headers['Sec-Ch-Ua-Platform'] = randomPlatform()

  // Add DNT randomly (some users enable it)
  if (Math.random() > 0.7) {
    headers.DNT = '1'
  }

  // Referer header (omit for direct navigation)
  // Only add if coming from same domain (simulate internal navigation)
  if (Math.random() > 0.6) {
    headers.Referer = `${urlObj.protocol}//${urlObj.hostname}/`
  }

  return headers
}

/**
 * Randomly select platform for Sec-Ch-Ua-Platform header
 */
function randomPlatform(): string {
  const platforms = ['"Windows"', '"macOS"', '"Linux"']
  return platforms[Math.floor(Math.random() * platforms.length)]
}
