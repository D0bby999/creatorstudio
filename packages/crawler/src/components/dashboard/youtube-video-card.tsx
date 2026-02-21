import { useState } from 'react'
import type { YouTubeVideo } from '../../scrapers/youtube/youtube-types.js'
import { safeImageUrl } from './social-platform-config.js'

interface YouTubeVideoCardProps {
  item: YouTubeVideo
}

export function YouTubeVideoCard({ item: video }: YouTubeVideoCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = video.description.length > 200
  const displayText = expanded || !isLong ? video.description : video.description.slice(0, 200) + '...'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {video.publishedAt instanceof Date ? video.publishedAt.toLocaleDateString() : String(video.publishedAt)}
        </span>
        {video.duration && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
            {video.duration}
          </span>
        )}
      </div>

      {safeImageUrl(video.thumbnailUrl) && (
        <div className="mb-3">
          <img src={safeImageUrl(video.thumbnailUrl)!} alt="" className="h-48 w-full rounded object-cover" loading="lazy" />
        </div>
      )}

      <h4 className="mb-1 text-sm font-medium text-gray-900">{video.title}</h4>

      {displayText && (
        <p className="mb-2 whitespace-pre-wrap text-xs text-gray-600">{displayText}</p>
      )}
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mb-2 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>{video.viewCount.toLocaleString()} views</span>
        <span>{video.likeCount.toLocaleString()} likes</span>
        <span>{video.commentCount.toLocaleString()} comments</span>
        <a
          href={`https://youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-blue-600 hover:underline"
        >
          Watch on YouTube
        </a>
      </div>
    </div>
  )
}
