import { useState } from 'react'
import { CheckCircle, Clock, FileText, Plus } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Badge } from '@creator-studio/ui/components/badge'
import { EmptyState } from '@creator-studio/ui/components/composites/empty-state'
import { SocialPostComposer } from './social-post-composer'

const statusConfig = {
  published: { icon: CheckCircle, label: 'Published', className: 'bg-success/10 text-success border-success/20' },
  scheduled: { icon: Clock, label: 'Scheduled', className: 'bg-info/10 text-info border-info/20' },
  draft: { icon: FileText, label: 'Draft', className: 'bg-muted text-muted-foreground' },
} as const

interface SocialPostsTableProps {
  posts: any[]
  accounts: any[]
}

export function SocialPostsTable({ posts, accounts }: SocialPostsTableProps) {
  const [showComposer, setShowComposer] = useState(false)

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Posts</h2>
        <Button size="sm" onClick={() => setShowComposer(!showComposer)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {showComposer && <SocialPostComposer accounts={accounts} onClose={() => setShowComposer(false)} />}

      <Card>
        <CardContent className="p-6">
          {posts.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No posts yet"
              description="Create your first post to get started"
            />
          ) : (
            <div className="space-y-3">
              {posts.map((post) => {
                const status = statusConfig[post.status as keyof typeof statusConfig] || statusConfig.draft
                const StatusIcon = status.icon
                return (
                  <div key={post.id} className="flex items-start justify-between rounded-lg border p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">@{post.socialAccount.username}</span>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm">{post.content.slice(0, 100)}...</p>
                      {post.analytics && (
                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          <span>{post.analytics.likes} likes</span>
                          <span>{post.analytics.comments} comments</span>
                          <span>{post.analytics.impressions} impressions</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : post.scheduledAt
                          ? `Scheduled: ${new Date(post.scheduledAt).toLocaleDateString()}`
                          : 'Draft'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
