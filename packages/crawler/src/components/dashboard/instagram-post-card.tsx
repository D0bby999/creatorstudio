import { useState } from 'react'
import type { InstagramPost } from '../../scrapers/instagram/instagram-types.js'
import { safeImageUrl } from './social-platform-config.js'

interface InstagramPostCardProps {
  item: InstagramPost
}

export function InstagramPostCard({ item: post }: InstagramPostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = post.caption.length > 200
  const displayText = expanded || !isLong ? post.caption : post.caption.slice(0, 200) + '...'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {post.timestamp instanceof Date ? post.timestamp.toLocaleDateString() : String(post.timestamp)}
        </span>
        <div className="flex gap-2">
          {post.isVideo && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">Video</span>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {post.shortcode}
          </span>
        </div>
      </div>

      {displayText && (
        <p className="mb-2 whitespace-pre-wrap text-sm text-gray-800">{displayText}</p>
      )}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mb-2 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {post.mediaUrls.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-1">
          {post.mediaUrls.slice(0, 4).map((src, i) => {
            const safeSrc = safeImageUrl(src)
            return safeSrc ? (
              <img key={i} src={safeSrc} alt="" className="h-32 w-full rounded object-cover" loading="lazy" />
            ) : null
          })}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>{post.likeCount.toLocaleString()} likes</span>
        <span>{post.commentCount.toLocaleString()} comments</span>
        <a
          href={`https://instagram.com/p/${post.shortcode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-600 hover:underline"
        >
          View on Instagram
        </a>
      </div>
    </div>
  )
}
