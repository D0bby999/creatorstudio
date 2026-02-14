import { Form } from 'react-router'
import { Button } from '@creator-studio/ui/components/button'
import { Card, CardContent } from '@creator-studio/ui/components/card'
import { Input } from '@creator-studio/ui/components/input'
import { Label } from '@creator-studio/ui/components/label'

interface SocialPostComposerProps {
  accounts: any[]
  onClose: () => void
}

export function SocialPostComposer({ accounts, onClose }: SocialPostComposerProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Create Post</h2>
        <Form method="post" className="space-y-4">
          <div>
            <Label htmlFor="content">Caption</Label>
            <textarea
              id="content"
              name="content"
              rows={4}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              placeholder="Write your caption..."
            />
          </div>
          <div>
            <Label htmlFor="mediaUrl">Media URL</Label>
            <Input id="mediaUrl" name="mediaUrl" type="url" placeholder="https://example.com/image.jpg" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="account">Account</Label>
            <select id="account" name="socialAccountId" className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm">
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  @{account.username} ({account.platform})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="scheduledAt">Schedule (optional)</Label>
            <Input id="scheduledAt" name="scheduledAt" type="datetime-local" className="mt-1" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" name="action" value="publish">
              Publish Now
            </Button>
            <Button type="submit" name="action" value="schedule" variant="outline">
              Schedule
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}
