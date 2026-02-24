export interface UnsplashPhoto {
  id: string
  urls: {
    thumb: string
    small: string
    regular: string
  }
  user: {
    name: string
    links: {
      html: string
    }
  }
  alt_description: string | null
  width: number
  height: number
}

export interface UnsplashSearchResult {
  results: UnsplashPhoto[]
  total: number
  total_pages: number
}

export async function searchPhotos(
  query: string,
  page = 1,
  perPage = 20
): Promise<UnsplashSearchResult> {
  const response = await fetch('/api/canvas/unsplash-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, page, perPage }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to search photos' }))
    throw new Error(error.message || 'Failed to search photos')
  }

  return response.json()
}

export function buildAttributionText(photo: UnsplashPhoto): string {
  return `Photo by ${photo.user.name} on Unsplash`
}
