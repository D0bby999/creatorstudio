import { useState } from 'react'
import type { Tweet } from '../../scrapers/twitter/twitter-types.js'
import { safeImageUrl } from './social-platform-config.js'

interface TwitterTweetCardProps {
  item: Tweet
}

export function TwitterTweetCard({ item: tweet }: TwitterTweetCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = tweet.text.length > 280
  const displayText = expanded || !isLong ? tweet.text : tweet.text.slice(0, 280) + '...'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {tweet.timestamp instanceof Date ? tweet.timestamp.toLocaleDateString() : String(tweet.timestamp)}
        </span>
        <div className="flex gap-2">
          {tweet.isRetweet && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Retweet</span>
          )}
        </div>
      </div>

      <p className="mb-2 whitespace-pre-wrap text-sm text-gray-800">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mb-2 text-xs font-medium text-blue-600 hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {tweet.mediaUrls.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-1">
          {tweet.mediaUrls.slice(0, 4).map((src, i) => {
            const safeSrc = safeImageUrl(src)
            return safeSrc ? (
              <img key={i} src={safeSrc} alt="" className="h-32 w-full rounded object-cover" loading="lazy" />
            ) : null
          })}
        </div>
      )}

      <div className="flex items-center gap-4 border-t border-gray-100 pt-2 text-xs text-gray-500">
        <span>{tweet.likeCount.toLocaleString()} likes</span>
        <span>{tweet.retweetCount.toLocaleString()} retweets</span>
        <span>{tweet.replyCount.toLocaleString()} replies</span>
        {tweet.id && (
          <a
            href={`https://x.com/i/status/${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-blue-600 hover:underline"
          >
            View on X
          </a>
        )}
      </div>
    </div>
  )
}
