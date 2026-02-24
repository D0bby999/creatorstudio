import { useState, useEffect, useRef, useCallback } from 'react'
import type { Editor } from 'tldraw'
import { searchPhotos, buildAttributionText, type UnsplashPhoto } from '../lib/element-library/unsplash-client'
import { searchWithCache, debounce } from '../lib/element-library/element-search-manager'
import { addRecentElement } from '../lib/element-library/recently-used-elements'

interface ElementLibraryPhotosTabProps {
  editor: Editor
  searchQuery: string
}

export function ElementLibraryPhotosTab({ editor, searchQuery }: ElementLibraryPhotosTabProps) {
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadPhotos = useCallback(async (query: string, pageNum: number, append = false) => {
    if (!query.trim() || loadingRef.current) return

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const cacheKey = `photos:${query}:${pageNum}`
      const result = await searchWithCache(cacheKey, () => searchPhotos(query, pageNum, 20))

      setPhotos(prev => append ? [...prev, ...result.results] : result.results)
      setHasMore(pageNum < result.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
      setPhotos([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Debounced search on query change
  useEffect(() => {
    const debouncedLoad = debounce(() => {
      setPage(1)
      loadPhotos(searchQuery, 1, false)
    }, 300)

    debouncedLoad()
  }, [searchQuery, loadPhotos])

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const nextPage = page + 1
          setPage(nextPage)
          loadPhotos(searchQuery, nextPage, true)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, searchQuery, loadPhotos])

  const handlePhotoClick = (photo: UnsplashPhoto) => {
    const viewport = editor.getViewportPageBounds()
    const centerX = viewport.x + viewport.width / 2
    const centerY = viewport.y + viewport.height / 2

    // Calculate aspect ratio preserving dimensions
    const maxWidth = 400
    const aspectRatio = photo.width / photo.height
    const width = Math.min(maxWidth, photo.width)
    const height = width / aspectRatio

    editor.createShape({
      type: 'enhanced-image',
      x: centerX - width / 2,
      y: centerY - height / 2,
      props: {
        w: width,
        h: height,
        src: photo.urls.regular,
        assetId: `unsplash-${photo.id}`,
      },
    })

    addRecentElement({
      type: 'photo',
      id: photo.id,
      preview: photo.urls.thumb,
      label: buildAttributionText(photo),
    })
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>
        <div style={{ marginBottom: 8 }}>Error: {error}</div>
        {error.includes('503') && (
          <div style={{ fontSize: 11, color: '#666' }}>Unsplash API key not configured</div>
        )}
      </div>
    )
  }

  if (!searchQuery.trim()) {
    return (
      <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
        Search for photos from Unsplash
      </div>
    )
  }

  return (
    <div style={{ padding: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {photos.map(photo => (
          <div
            key={photo.id}
            onClick={() => handlePhotoClick(photo)}
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: '#f0f0f0',
              aspectRatio: `${photo.width} / ${photo.height}`,
            }}
          >
            <img
              src={photo.urls.thumb}
              alt={photo.alt_description || 'Photo'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 4,
                fontSize: 9,
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {photo.user.name}
            </div>
          </div>
        ))}
      </div>

      {hasMore && <div ref={sentinelRef} style={{ height: 20, padding: 8, textAlign: 'center' }} />}

      {loading && (
        <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#999' }}>
          Loading...
        </div>
      )}
    </div>
  )
}
