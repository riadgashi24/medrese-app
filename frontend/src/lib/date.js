// Calendar dates keep their day regardless of the browser's timezone.
export function formatDate(value) {
  if (!value) return '—'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/)
  if (match) return `${match[3]}/${match[2]}/${match[1]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}
