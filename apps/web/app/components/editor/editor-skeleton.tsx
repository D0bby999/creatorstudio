import { Skeleton } from '@creator-studio/ui/components/skeleton'

export function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 w-24" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="flex flex-1">
        <div className="w-60 border-r p-4 space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/50">
          <Skeleton className="h-96 w-[600px] rounded-lg" />
        </div>
      </div>
    </div>
  )
}
