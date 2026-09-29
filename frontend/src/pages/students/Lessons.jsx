import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export const lessonDate = lesson => (lesson.starts_on || lesson.created_at || '').slice(0, 10)
export const sortedLessons = entries => entries.filter(e => e.kind === 'lesson').sort((a, b) => lessonDate(b).localeCompare(lessonDate(a)) || (a.subject?.name || '').localeCompare(b.subject?.name || '') || b.id - a.id)
const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function Lessons({ entries, dateLabel, ResourceLink }) {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('all')
  const [period, setPeriod] = useState(params.get('date') ? 'date' : 'week')
  const [selectedDate, setSelectedDate] = useState(params.get('date') || key(new Date()))
  const [weekOffset, setWeekOffset] = useState(0)
  const [limit, setLimit] = useState(7)
  const lessons = sortedLessons(entries)
  const subjects = [...new Map(lessons.map(e => [String(e.subject_id || 'none'), e.subject?.name || 'Pa lëndë'])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
  const start = new Date(); start.setDate(start.getDate() - (start.getDay() + 6) % 7 + weekOffset * 7)
  const end = new Date(start); end.setDate(end.getDate() + 6)
  const found = lessons.filter(e => {
    const date = lessonDate(e)
    return (subject === 'all' || String(e.subject_id || 'none') === subject)
      && `${e.title} ${e.description || ''} ${e.subject?.name || ''} ${e.author?.name || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
      && (period === 'all' || (period === 'date' ? date === selectedDate : date >= key(start) && date <= key(end)))
  })
  const groups = [...new Map(found.map(e => [lessonDate(e), []])).keys()].map(date => [date, found.filter(e => lessonDate(e) === date)])
  function change(setter, value) { setter(value); setLimit(7) }
  return <div className="space-y-5">
    <div className="rounded-xl border border-white/10 bg-surface-900 p-4 space-y-4">
      <p className="text-sm text-surface-400">Mësimet janë të ndara sipas ditës. Zgjidh lëndën ose kërko një temë; hape mësimin për përshkrimin dhe materialin.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input aria-label="Kërko mësime" placeholder="Kërko temë, lëndë ose profesor…" value={search} onChange={e => change(setSearch, e.target.value)} className="w-full rounded-lg border border-white/10 bg-surface-800 p-3 text-sm" />
        <select aria-label="Lënda" value={subject} onChange={e => change(setSubject, e.target.value)} className="rounded-lg bg-surface-800 p-3 text-sm"><option value="all">Të gjitha lëndët</option>{subjects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      </div>
      <div className="flex flex-wrap gap-2">{[['week', 'Sipas javës'], ['date', 'Zgjidh datën'], ['all', 'Arkivi i plotë']].map(([id, label]) => <Button key={id} variant={period === id ? 'default' : 'secondary'} aria-pressed={period === id} onClick={() => change(setPeriod, id)}>{label}</Button>)}</div>
      {period === 'week' && <div className="flex flex-wrap items-center gap-3"><Button variant="secondary" aria-label="Java e kaluar" onClick={() => change(setWeekOffset, weekOffset - 1)}>←</Button><span className="text-sm">{dateLabel(key(start))} – {dateLabel(key(end))}</span><Button variant="secondary" aria-label="Java e ardhshme" onClick={() => change(setWeekOffset, weekOffset + 1)}>→</Button>{weekOffset !== 0 && <Button variant="ghost" onClick={() => change(setWeekOffset, 0)}>Kjo javë</Button>}</div>}
      {period === 'date' && <label className="flex items-center gap-3 text-sm">Data<input type="date" value={selectedDate} onChange={e => change(setSelectedDate, e.target.value)} className="rounded-lg bg-surface-800 p-2" /></label>}
    </div>
    <p aria-live="polite" className="text-sm text-surface-400">{found.length} mësime · {groups.length} ditë</p>
    {groups.slice(0, limit).map(([date, items]) => <section key={date} className="overflow-hidden rounded-xl border border-white/10 bg-surface-900/60">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/5 px-4 py-3"><h2 className="font-medium">{date === key(new Date()) ? 'Sot · ' : ''}{date ? dateLabel(date) : 'Pa datë'}</h2><span className="text-xs text-surface-400">{items.length} mësime</span></div>
      {items.map(e => <details key={e.id} className="group border-b border-white/5 last:border-0"><summary className="cursor-pointer px-4 py-4 marker:text-brand-400 hover:bg-white/5 focus-visible:outline focus-visible:outline-brand-500"><span className="ml-1 inline-grid gap-1 align-top"><span className="text-xs font-medium text-brand-400">{e.subject?.name || 'Pa lëndë'}</span><span className="text-sm font-medium">{e.title}</span><span className="text-xs text-surface-400">{e.author?.name}{e.url ? ' · Ka material' : ''}</span></span></summary><div className="border-t border-white/5 px-6 py-4"><p className="whitespace-pre-wrap text-sm text-surface-300">{e.description || 'Nuk ka përshkrim shtesë.'}</p><ResourceLink url={e.url} /></div></details>)}
    </section>)}
    {!found.length && <div className="rounded-xl border border-dashed border-white/15 p-6"><p className="text-sm text-surface-400">Nuk ka mësime për këto filtra.</p><Button variant="ghost" onClick={() => { setSearch(''); setSubject('all'); setPeriod('all'); setLimit(7) }}>Shiko të gjitha mësimet</Button></div>}
    {groups.length > limit && <Button variant="secondary" onClick={() => setLimit(limit + 7)}>Shfaq 7 ditë të tjera</Button>}
  </div>
}
