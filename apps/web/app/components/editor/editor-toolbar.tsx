import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@creator-studio/ui/components/button'
import { Separator } from '@creator-studio/ui/components/separator'

interface EditorToolbarProps {
  title: string
  backTo?: string
  children?: React.ReactNode
}

export function EditorToolbar({ title, backTo = '/dashboard', children }: EditorToolbarProps) {
  return (
    <div className="flex h-12 items-center justify-between border-b px-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backTo} viewTransition aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-1">
        {children}
      </div>
    </div>
  )
}
