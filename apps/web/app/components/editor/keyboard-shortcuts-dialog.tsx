import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@creator-studio/ui/components/dialog'

interface ShortcutItem {
  key: string
  description: string
}

const shortcuts: ShortcutItem[] = [
  { key: 'Ctrl+S', description: 'Save project' },
  { key: 'Ctrl+Z', description: 'Undo' },
  { key: 'Ctrl+Shift+Z', description: 'Redo' },
  { key: 'Ctrl+E', description: 'Export' },
  { key: 'Ctrl+[', description: 'Toggle sidebar' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close dialog' },
]

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Quick access to common editor actions
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 py-4">
          {shortcuts.map(({ key, description }) => (
            <>
              <kbd
                key={`${key}-key`}
                className="rounded border border-border bg-muted px-2 py-1 text-xs font-mono text-muted-foreground"
              >
                {key}
              </kbd>
              <span key={`${key}-desc`} className="text-sm text-foreground">
                {description}
              </span>
            </>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
