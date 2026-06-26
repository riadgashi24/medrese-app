import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function StatCard({ label, value, hint, icon: Icon, trend, className }) {
  return (
    <div className={cn('rounded-xl border border-white/8 bg-surface-800/40 p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-surface-300">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-brand-400" />}
      </div>
      <div className="text-2xl font-bold text-surface-50 font-mono">{value}</div>
      {hint && (
        <div
          className={cn(
            'text-[10px] mt-1 flex items-center gap-1',
            trend === 'up' && 'text-emerald-400',
            trend === 'down' && 'text-red-400',
            !trend && 'text-surface-300',
          )}
        >
          {trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {hint}
        </div>
      )}
    </div>
  )
}
