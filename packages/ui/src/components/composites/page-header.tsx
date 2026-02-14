import * as React from 'react'
import { cn } from '../../lib/utils'

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-between', className)} {...props}>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
          {description && <p className='text-muted-foreground'>{description}</p>}
        </div>
        {children && <div className='flex items-center gap-2'>{children}</div>}
      </div>
    )
  }
)
PageHeader.displayName = 'PageHeader'

export { PageHeader }
