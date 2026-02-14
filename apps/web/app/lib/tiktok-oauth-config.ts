// TikTok OAuth configuration
// Configuration for TikTok Content Posting API OAuth flow

export const TIKTOK_OAUTH_CONFIG = {
  clientKey: process.env.TIKTOK_CLIENT_KEY || '',
  clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
  redirectUri: `${process.env.APP_URL || 'http://localhost:5173'}/api/oauth/tiktok/callback`,
  scopes: ['user.info.basic', 'video.upload', 'video.publish'],
}

export function buildTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: TIKTOK_OAUTH_CONFIG.clientKey,
    redirect_uri: TIKTOK_OAUTH_CONFIG.redirectUri,
    scope: TIKTOK_OAUTH_CONFIG.scopes.join(','),
    response_type: 'code',
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`
}
