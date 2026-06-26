import { cn } from '@/lib/utils'

const variants = {
  green: 'bg-brand-500/12 text-brand-400',
  blue: 'bg-blue-500/12 text-blue-400',
  purple: 'bg-purple-500/12 text-purple-400',
  amber: 'bg-amber-500/12 text-amber-400',
  red: 'bg-red-500/12 text-red-400',
  slate: 'bg-surface-300/12 text-surface-300',
  success: 'bg-emerald-500/12 text-emerald-400',
  warning: 'bg-amber-500/12 text-amber-400',
  danger: 'bg-red-500/12 text-red-400',
}

export function Badge({ className, variant = 'green', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
