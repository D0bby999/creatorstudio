import { useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  url: string
  status: 'completed' | 'retrying' | 'failed'
  message?: string
}

interface CrawlLogStreamProps {
  logs: LogEntry[]
}

export function CrawlLogStream({ logs }: CrawlLogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  const getStatusColor = (status: LogEntry['status']) => {
    const colors = {
      completed: 'text-green-600',
      retrying: 'text-yellow-600',
      failed: 'text-red-600'
    }
    return colors[status]
  }

  return (
    <div
      ref={containerRef}
      className="h-96 overflow-y-auto rounded-lg border border-gray-200 bg-gray-900 p-4 font-mono text-sm"
    >
      {logs.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500">
          No logs yet
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-3 text-gray-300">
              <span className="text-gray-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={getStatusColor(log.status)}>
                {log.status.toUpperCase()}
              </span>
              <span className="truncate">{log.url}</span>
              {log.message && <span className="text-gray-400">- {log.message}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
