import { useState } from 'react'
import type { TikTokVideo } from '../../scrapers/tiktok/tiktok-types.js'
import { safeImageUrl } from './social-platform-config.js'

interface TikTokVideoCardProps {
  item: TikTokVideo
}

export function TikTokVideoCard({ item: video }: TikTokVideoCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = video.description.length > 200
  const displayText = expanded || !isLong ? video.description : video.description.slice(0, 200) + '...'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {video.timestamp instanceof Date ? video.timestamp.toLocaleDateString() : String(video.timestamp)}
        </span>
        {video.musicTitle && (
          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
            {video.musicTitle.slice(0, 30)}
          </span>
        )}
      </div>

      {safeImageUrl(video.coverUrl) && (
        <div className="mb-3">
          <img src={safeImageUrl(video.coverUrl)!} alt="" className="h-48 w-full rounded object-cover" loading="lazy" />
        </div>
      )}

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

      <div className="flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>{video.viewCount.toLocaleString()} views</span>
        <span>{video.likeCount.toLocaleString()} likes</span>
        <span>{video.commentCount.toLocaleString()} comments</span>
        <span>{video.shareCount.toLocaleString()} shares</span>
      </div>
    </div>
  )
}
