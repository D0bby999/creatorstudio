// Meta (Facebook/Instagram/Threads) OAuth configuration
// Shared configuration for all Meta platform OAuth flows

export const META_OAUTH_CONFIG = {
  clientId: process.env.META_APP_ID || '',
  clientSecret: process.env.META_APP_SECRET || '',
  redirectUri: `${process.env.APP_URL || 'http://localhost:5173'}/api/oauth/meta/callback`,
  scopes: {
    instagram: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    facebook: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'],
    threads: ['threads_basic', 'threads_content_publish', 'threads_manage_replies'],
  },
}

export function buildMetaAuthUrl(state: string): string {
  const scopeSet = new Set([
    ...META_OAUTH_CONFIG.scopes.instagram,
    ...META_OAUTH_CONFIG.scopes.facebook,
    ...META_OAUTH_CONFIG.scopes.threads,
  ])
  const allScopes = Array.from(scopeSet)

  const params = new URLSearchParams({
    client_id: META_OAUTH_CONFIG.clientId,
    redirect_uri: META_OAUTH_CONFIG.redirectUri,
    scope: allScopes.join(','),
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v22.0/dialog/oauth?${params}`
}
