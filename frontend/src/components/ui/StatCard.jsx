import { cn } from '@/lib/utils'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function StatCard({ label, value, hint, icon: Icon, trend, className }) {
  return (
    <div className={cn('school-stat p-4 md:p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-surface-300">{label}</span>
        {Icon && <span className="stat-icon"><Icon className="h-5 w-5" /></span>}
      </div>
      <div className="text-3xl font-semibold text-surface-50 tracking-tight tabular-nums">{value}</div>
      {hint && (
        <div
          className={cn(
            'text-xs mt-2 flex items-center gap-1',
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
