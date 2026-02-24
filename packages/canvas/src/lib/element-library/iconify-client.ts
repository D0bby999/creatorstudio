export interface IconifySearchResult {
  icons: string[]
  total: number
}

export const ICON_CATEGORIES = [
  'arrows',
  'social',
  'weather',
  'emoji',
  'logos',
  'ui',
  'devices',
]

export async function searchIcons(
  query: string,
  limit = 64
): Promise<IconifySearchResult> {
  const response = await fetch(
    `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`
  )

  if (!response.ok) {
    throw new Error('Failed to search icons')
  }

  const data = await response.json()
  return {
    icons: data.icons || [],
    total: data.total || 0,
  }
}

export async function getIconSvg(prefix: string, name: string): Promise<string> {
  const response = await fetch(`https://api.iconify.design/${prefix}/${name}.svg`)

  if (!response.ok) {
    throw new Error('Failed to fetch icon SVG')
  }

  return response.text()
}
