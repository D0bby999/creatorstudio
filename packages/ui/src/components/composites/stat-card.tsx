import * as React from 'react'
import { Card, CardContent, CardHeader } from '../card'
import { cn } from '../../lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    positive: boolean
  }
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ title, value, description, icon, trend, className, ...props }, ref) => {
    return (
      <Card ref={ref} className={className} {...props}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
          {icon && <div className='h-4 w-4 text-muted-foreground'>{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{value}</div>
          {(description || trend) && (
            <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
              {trend && (
                <span className={cn('flex items-center gap-1', trend.positive ? 'text-green-600' : 'text-red-600')}>
                  {trend.positive ? <TrendingUp className='h-3 w-3' /> : <TrendingDown className='h-3 w-3' />}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && <span>{description}</span>}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
StatCard.displayName = 'StatCard'

export { StatCard }
