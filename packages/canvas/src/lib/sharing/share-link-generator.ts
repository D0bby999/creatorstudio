/** Canvas share link generation and management utilities */

export interface ShareLink {
  id: string
  roomId: string
  token: string
  permission: 'view' | 'comment' | 'edit'
  createdById: string
  expiresAt: string | null
  createdAt: string
}

export interface CreateShareLinkParams {
  roomId: string
  permission: 'view' | 'comment' | 'edit'
  expiresAt?: string
}

/**
 * Generate cryptographically secure share token (128-bit)
 */
export function generateShareToken(): string {
  // Use crypto.randomUUID for secure random token
  return crypto.randomUUID()
}

/**
 * Create a new share link for room
 */
export async function createShareLink(
  params: CreateShareLinkParams,
): Promise<ShareLink> {
  const response = await fetch('/api/canvas/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Failed to create share link: ${response.statusText}`)
  }

  const data = await response.json()
  return data.shareLink
}

/**
 * List all share links for a room
 */
export async function listShareLinks(roomId: string): Promise<ShareLink[]> {
  const response = await fetch(`/api/canvas/share?roomId=${roomId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch share links: ${response.statusText}`)
  }

  const data = await response.json()
  return data.shareLinks || []
}

/**
 * Revoke (delete) a share link
 */
export async function revokeShareLink(linkId: string): Promise<void> {
  const response = await fetch(`/api/canvas/share?linkId=${linkId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to revoke share link: ${response.statusText}`)
  }
}

/**
 * Validate share link token and check expiry
 */
export async function validateShareToken(
  token: string,
): Promise<ShareLink | null> {
  const response = await fetch(`/api/canvas/share?token=${token}`)

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  const link = data.shareLink

  if (!link) {
    return null
  }

  // Check expiry
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return null
  }

  return link
}

/**
 * Build full share URL for token
 */
export function buildShareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin
  return `${base}/canvas/shared/${token}`
}
