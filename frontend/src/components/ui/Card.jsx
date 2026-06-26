import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('glass-card p-5 md:p-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn('font-display text-xl text-surface-50', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }) {
  return <p className={cn('text-sm text-surface-300 mt-1', className)}>{children}</p>
}

export function CardContent({ className, children }) {
  return <div className={cn(className)}>{children}</div>
}
