import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@creator-studio/ui/components/scroll-area'
import { Button } from '@creator-studio/ui/components/button'
import { cn } from '@creator-studio/ui/lib/utils'

interface EditorSidePanelProps {
  title: string
  children: React.ReactNode
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

export function EditorSidePanel({
  title,
  children,
  collapsed = false,
  onToggle,
  className,
}: EditorSidePanelProps) {
  return (
    <aside
      className={cn(
        'border-r bg-background transition-[width] duration-200',
        collapsed ? 'w-12' : 'w-60',
        className,
      )}
    >
      <div className="flex h-12 items-center justify-between border-b px-3">
        {!collapsed && <h3 className="text-sm font-medium truncate">{title}</h3>}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('h-8 w-8', collapsed && 'mx-auto')}
            aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {!collapsed && (
        <ScrollArea className="h-[calc(100vh-3rem)]">
          <div className="p-3 space-y-3">{children}</div>
        </ScrollArea>
      )}
    </aside>
  )
}
