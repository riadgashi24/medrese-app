import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="font-display text-3xl text-surface-50">{title}</h1>
        {description && (
          <p className="text-sm text-surface-300 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center py-16 px-6 text-center">
      <h3 className="font-display text-xl text-surface-50">{title}</h3>
      <p className="text-sm text-surface-300 mt-2 max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function SectionLabel({ children }) {
  return <span className="section-label">{children}</span>
}

export function ActivityList({ items }) {
  const toneClass = {
    success: 'text-emerald-400',
    info: 'text-blue-400',
    warning: 'text-amber-400',
    neutral: 'text-surface-300',
    danger: 'text-red-400',
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex justify-between items-center py-2.5 border-b border-white/5 text-sm"
        >
          <span className="text-surface-300">{item.text}</span>
          <span className={cn('text-xs font-mono', toneClass[item.tone] || toneClass.neutral)}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}
