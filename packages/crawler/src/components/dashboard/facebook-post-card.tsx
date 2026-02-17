import { useState } from 'react'
import type { FacebookPost } from '../../scrapers/facebook/facebook-types.js'

interface FacebookPostCardProps {
  post: FacebookPost
}

export function FacebookPostCard({ post }: FacebookPostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = post.text.length > 200
  const displayText = expanded || !isLong ? post.text : post.text.slice(0, 200) + '...'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span className="font-medium text-gray-900">{post.author}</span>
          <span className="ml-2 text-xs text-gray-500">{post.timestampRaw || 'Unknown time'}</span>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {post.source}
        </span>
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

      {post.images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-1">
          {post.images.slice(0, 4).map((src, i) => (
            <img key={i} src={src} alt="" className="h-32 w-full rounded object-cover" loading="lazy" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>{post.reactions} reactions</span>
        <span>{post.comments} comments</span>
        {post.shares !== null && <span>{post.shares} shares</span>}
        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-600 hover:underline"
        >
          View on Facebook
        </a>
      </div>
    </div>
  )
}
