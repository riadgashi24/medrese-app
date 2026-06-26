import { cn } from '@/lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn('text-sm font-medium text-surface-200', className)}
      {...props}
    >
      {children}
    </label>
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-lg border border-white/10 bg-surface-900/60 px-3 py-2 text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
