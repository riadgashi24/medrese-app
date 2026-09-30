import { formatDate } from '../../lib/date.js'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, Bell, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, GraduationCap, ListChecks, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { usePortal, useInbox } from '@/lib/studentPortal'
import { Lessons } from './Lessons'
export { usePortal, useInbox } from '@/lib/studentPortal'

const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']
export const dateLabel = value => value ? formatDate(value) : 'Pa datë'
export const dateKey = value => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
const today = () => dateKey(new Date())
const days = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë', 'E diel']
export const kinds = { lesson: 'Mësim', material: 'Material', exam: 'Provim', assignment: 'Detyrë', holiday: 'Festë', break: 'Pushim', event: 'Aktivitet', group: 'Grup WhatsApp', announcement: 'Njoftim' }
export const portalLinks = [
  ['lessons', 'Mësimet', BookOpen], ['assignments', 'Detyrat', ListChecks], ['calendar', 'Kalendari', CalendarDays],
  ['timetable', 'Orari', Clock], ['grades', 'Notat', GraduationCap], ['materials', 'Materialet', BookOpen],
  ['notifications', 'Njoftimet', Bell], ['groups', 'Grupet', Users],
]

export function Empty({ children }) { return <p className="py-6 text-sm text-surface-400">{children}</p> }
export function Panel({ title, to, children }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle className="text-base">{title}</CardTitle>{to && <Link className="text-xs text-brand-400 hover:underline" to={to}>Shiko të gjitha →</Link>}</CardHeader><CardContent>{children}</CardContent></Card>
}
export function ResourceLink({ url, children = 'Hap materialin' }) {
  if (!url || !/^(https?:\/\/|\/(?!\/))/i.test(url)) return null
  return <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand-400 hover:underline">{children}<ArrowUpRight className="h-4 w-4" /></a>
}
export function AssignmentList({ items = [] }) {
  return items.length ? <div className="space-y-3">{items.map(a => {
    const submitted = a.submissions?.some(s => ['Submitted', 'Graded'].includes(s.status))
    const overdue = !a.completed_at && !submitted && a.due_date?.slice(0, 10) < today()
    return <article key={a.id} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-brand-400">{a.subject?.name}</p><h3 className="mt-1 font-medium">{a.title}</h3></div><Badge variant={submitted ? 'success' : overdue ? 'danger' : 'slate'}>{a.completed_at ? 'E përfunduar nga profesori' : submitted ? 'E dorëzuar' : overdue ? 'Afati ka kaluar' : 'Për t’u kryer'}</Badge></div><p className="mt-2 whitespace-pre-wrap text-sm text-surface-300">{a.description}</p><p className="mt-3 text-xs text-surface-400">Afati: {dateLabel(a.due_date)}</p><ResourceLink url={a.file_url} /></article>
  })}</div> : <Empty>Nuk ka detyra të caktuara për klasën tënde.</Empty>
}
export function Schedule({ slots = [], compact = false }) {
  const selected = compact ? [(new Date().getDay() + 6) % 7] : [0, 1, 2, 3, 4, 5, 6]
  return <div className={compact ? '' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>{selected.map(day => {
    const lessons = slots.filter(s => s.day_of_week === day + 1)
    if (!compact && day > 4 && !lessons.length) return null
    return <div key={day}>{!compact && <h3 className="mb-3 font-medium text-brand-400">{days[day]}</h3>}{lessons.length ? lessons.map(s => <div key={s.id} className="flex items-center gap-4 border-b border-white/10 py-3"><div className="w-20 shrink-0 text-xs text-surface-400"><p className="text-surface-200">Ora {s.slot_number}</p>{s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}</div><div><p className="text-sm font-medium">{s.subject?.name || s.activity_label || 'Lëndë'}</p><p className="mt-1 text-xs text-surface-400">{s.teacher_user?.name || 'Profesori ende nuk është caktuar'}</p></div></div>) : <Empty>Nuk ka orë të planifikuara{compact ? ' sot' : ''}.</Empty>}</div>
  })}</div>
}
export function calendarEvents(data) {
  return [...(data?.entries || []).filter(e => ['exam', 'holiday', 'break', 'event', 'announcement'].includes(e.kind) && e.starts_on).map(e => ({ ...e, id: `entry-${e.id}` })),
    ...(data?.assignments || []).map(a => ({ id: `assignment-${a.id}`, kind: 'assignment', title: a.title, description: a.description, starts_on: a.due_date?.slice(0, 10), subject: a.subject }))]
}
function Calendar({ data }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(today)
  const events = calendarEvents(data)
  const [filter, setFilter] = useState('all')
  const filtered = events.filter(e => filter === 'all' || e.kind === filter)
  const onDate = key => filtered.filter(e => e.starts_on <= key && (e.ends_on || e.starts_on) >= key)
  const offset = (month.getDay() + 6) % 7
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  function move(delta) { const next = new Date(month.getFullYear(), month.getMonth() + delta, 1); setMonth(next); setSelected(dateKey(next)) }
  return <div className="grid gap-5 lg:grid-cols-[2fr_1fr]"><Panel title="Kalendari shkollor"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Muaji i kaluar" onClick={() => move(-1)}><ChevronLeft /></Button><h3 className="text-sm font-medium">{months[month.getMonth()] + ' ' + month.getFullYear()}</h3><Button variant="ghost" size="icon" aria-label="Muaji i ardhshëm" onClick={() => move(1)}><ChevronRight /></Button></div><select aria-label="Lloji i ngjarjes" className="rounded-lg bg-surface-800 p-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Të gjitha ngjarjet</option>{['exam', 'assignment', 'holiday', 'break', 'event', 'announcement'].map(k => <option key={k} value={k}>{kinds[k]}</option>)}</select></div><div className="grid grid-cols-7 gap-1">{days.map(d => <div key={d} className="py-2 text-center text-xs text-surface-400">{d.slice(2, 5)}</div>)}{Array.from({ length: offset }, (_, i) => <div key={`blank-${i}`} />)}{Array.from({ length: total }, (_, i) => {
    const key = dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)); const found = onDate(key)
    return <button key={key} onClick={() => setSelected(key)} aria-label={`${dateLabel(key)}, ${found.length} ngjarje`} aria-pressed={selected === key} className={`min-h-20 rounded-lg border p-2 text-left ${selected === key ? 'border-brand-500 bg-brand-500/15' : 'border-white/5 hover:bg-white/5'} ${key === today() ? 'text-brand-400' : ''}`}><span className="text-sm">{i + 1}</span>{found.slice(0, 2).map(e => <span key={e.id} className="mt-1 block truncate rounded bg-brand-500/15 px-1 text-[10px] text-brand-300" title={e.title}>{e.title}</span>)}{found.length > 2 && <span className="text-[10px]">+{found.length - 2}</span>}</button>
  })}</div></Panel><Panel title={dateLabel(selected)}>{onDate(selected).length ? onDate(selected).map(e => <article key={e.id} className="border-b border-white/10 py-4"><Badge variant="slate">{kinds[e.kind]}</Badge><h3 className="mt-2 font-medium">{e.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-surface-400">{e.description}</p>{e.ends_on && <p className="mt-2 text-xs">Deri më {dateLabel(e.ends_on)}</p>}</article>) : <Empty>Nuk ka ngjarje për këtë datë.</Empty>}</Panel></div>
}
function Inbox() {
  const query = useInbox(); const client = useQueryClient(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [onlyUnread, setOnlyUnread] = useState(false)
  async function mark(keys) { setBusy(true); setError(''); try { for (let i = 0; i < keys.length; i += 500) await api.studentPortal.markRead(keys.slice(i, i + 500)); await client.invalidateQueries({ queryKey: ['student-inbox'] }) } catch { setError('Njoftimet nuk u shënuan si të lexuara. Provo përsëri.') } finally { setBusy(false) } }
  if (query.isPending) return <Empty>Duke ngarkuar njoftimet…</Empty>
  if (query.isError) return <LoadError retry={query.refetch} />
  const items = query.data || []; const unread = items.filter(n => !n.read)
  return <Panel title={`${unread.length} njoftime të palexuara`}><div className="mb-4 flex flex-wrap gap-3"><Button variant="secondary" disabled={busy || !unread.length} onClick={() => mark(unread.map(n => n.key))}>Shëno të gjitha si të lexuara</Button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} />Vetëm të palexuarat</label></div>{error && <p role="alert" className="text-red-400">{error}</p>}{(onlyUnread ? unread : items).map(n => <article key={n.key} className={`mb-2 flex items-center justify-between gap-3 rounded-xl border p-4 ${n.read ? 'border-white/5' : 'border-brand-500/30 bg-brand-500/5'}`}><Link to={n.path} onClick={() => { if (!n.read) mark([n.key]) }}><h3 className="text-sm font-medium">{n.title}</h3><p className="mt-1 text-xs text-surface-400">{dateLabel(n.date)}</p></Link>{!n.read && <Button size="sm" variant="ghost" disabled={busy} onClick={() => mark([n.key])}>U lexua</Button>}</article>)}{!(onlyUnread ? unread : items).length && <Empty>Nuk ka njoftime{onlyUnread ? ' të palexuara' : ''}.</Empty>}</Panel>
}
export function LoadError({ retry }) { return <div role="alert" className="rounded-xl border border-red-500/30 p-5"><p className="mb-3 text-sm text-red-400">Të dhënat nuk u ngarkuan.</p><Button variant="secondary" onClick={() => retry()}>Provo përsëri</Button></div> }
function GradesAttendance({ section }) {
  const { user } = useAuth()
  const query = useQuery({ queryKey: ['student', section, user?.id], queryFn: () => api.studentPortal[section]().then(r => r.data) })
  if (query.isPending) return <Empty>Duke ngarkuar…</Empty>
  if (query.isError) return <LoadError retry={query.refetch} />
  if (section === 'attendance') return <div className="space-y-5">
    <Panel title="Mungesat dhe vonesat sipas orës">
      {query.data?.lesson_records?.length ? query.data.lesson_records.map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-3">
        <div><p className="text-sm font-medium">{r.subject} · Ora {r.slot_number}</p><p className="mt-1 text-xs text-surface-400">{dateLabel(r.date)} · {r.title}</p></div>
        <Badge variant={r.status === 'Late' ? 'warning' : 'danger'}>{r.status === 'Late' ? 'Vonesë' : 'Mungesë'}</Badge>
      </div>) : <Empty>Nuk ka mungesa ose vonesa në orët e regjistruara.</Empty>}
    </Panel>
    <Panel title="Regjistrimet e tjera të prezencës">
      {query.data?.records?.length ? query.data.records.map(r => <div key={r.id} className="flex justify-between gap-4 border-b border-white/10 py-3 text-sm"><span>{dateLabel(r.date)}</span><span>{r.status === 'Late' ? 'Vonesë' : 'Mungesë'} · {r.status === 'Excused' || r.absence_type === 'Excused' ? 'E arsyetuar' : r.absence_type === 'Unexcused' ? 'E paarsyetuar' : 'Në shqyrtim'}</span></div>) : <Empty>Nuk ka regjistrime të tjera.</Empty>}
    </Panel>
  </div>
  const grades = query.data || []
  return <Panel title="Suksesi sipas lëndës">
    <p className="mb-4 text-sm text-surface-400">Notat dymujore shfaqen sipas periudhës. T1 dhe T2 janë notat e gjysmëvjetorëve; NP është nota përfundimtare.</p>
    {grades.map(g => <article key={g.id} className="border-b border-white/10 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-medium">{g.subject}</h3><div className="flex gap-2"><Badge variant="slate">T1: {g.term_1 ?? '—'}</Badge><Badge variant="slate">T2: {g.term_2 ?? '—'}</Badge><Badge variant="success">NP: {g.final ?? '—'}</Badge></div></div>
      {!!g.period_grades?.length && <div className="mt-4 flex flex-wrap gap-2">{g.period_grades.map(p => <span key={p.period} className="rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs">{p.label}: <strong className="text-brand-400">{p.grade}</strong></span>)}</div>}
      {g.period_average != null && <p className="mt-3 text-xs text-surface-400">Mesatarja e notave dymujore: {Number(g.period_average).toFixed(2)}</p>}
    </article>)}
    {!grades.length && <Empty>Notat do të shfaqen pasi t’i regjistrojnë profesorët.</Empty>}
  </Panel>
}
export function StudentPortalPage() {
  const { section } = useParams(); const { user } = useAuth(); const query = usePortal()
  const [search, setSearch] = useState(''); const [assignmentFilter, setAssignmentFilter] = useState('all')
  if (!['student', 'boarding'].includes(user?.role)) return <Navigate to="/dashboard" replace />
  const titles = { ...Object.fromEntries(portalLinks.map(([k, v]) => [k, v])), attendance: 'Prezenca ime', announcements: 'Njoftimet e klasës', quizzes: 'Kuize online' }
  if (!titles[section]) return <Navigate to="/dashboard" replace />
  let content
  const data = query.data
  if (section === 'notifications') content = <Inbox />
  else if (['grades', 'attendance'].includes(section)) content = <GradesAttendance key={section} section={section} />
  else if (section === 'quizzes') content = <Panel title="Kuize online"><Badge variant="slate">Në plan për të ardhmen</Badge><Empty>Këtu profesorët do të mund të publikojnë kuize për ushtrim dhe vlerësim. Ky funksion ende nuk është aktiv.</Empty></Panel>
  else if (query.isPending) content = <Empty>Duke ngarkuar…</Empty>
  else if (query.isError) content = <LoadError retry={query.refetch} />
  else if (section === 'calendar') content = <Calendar data={data} />
  else if (section === 'lessons') content = <Lessons entries={data.entries} dateLabel={dateLabel} ResourceLink={ResourceLink} />
  else if (section === 'timetable') content = <Panel title="Orari javor i klasës"><Schedule slots={data.schedule} /></Panel>
  else if (section === 'assignments') content = <Panel title="Detyrat e mia"><select aria-label="Filtro detyrat" value={assignmentFilter} onChange={e => setAssignmentFilter(e.target.value)} className="mb-4 rounded-lg bg-surface-800 p-2 text-sm"><option value="all">Të gjitha</option><option value="pending">Për t’u kryer</option><option value="submitted">Të dorëzuara</option><option value="completed">Të përfunduara</option></select><AssignmentList items={data.assignments.filter(a => assignmentFilter === 'all' || (assignmentFilter === 'completed' ? Boolean(a.completed_at) : assignmentFilter === 'submitted' ? a.submissions.some(s => ['Submitted', 'Graded'].includes(s.status)) : !a.completed_at && !a.submissions.some(s => ['Submitted', 'Graded'].includes(s.status))))} /></Panel>
  else {
    const kind = { lessons: 'lesson', materials: 'material', groups: 'group', announcements: 'announcement' }[section]
    const entries = data.entries.filter(e => e.kind === kind)
    if (section === 'materials') {
      entries.push(...data.materials.map(d => ({ ...d, id: `shared-${d.id}`, url: d.file_url, label: 'Biblioteka e shkollës' })), ...data.documents.filter(d => d.document).map(d => ({ ...d.document, id: `personal-${d.id}`, url: d.document.file_url, label: 'Dokument personal' })))
    }
    const found = entries.filter(e => `${e.title} ${e.subject?.name || ''} ${e.description || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    content = <><input aria-label="Kërko" placeholder="Kërko sipas titullit ose lëndës…" value={search} onChange={e => setSearch(e.target.value)} className="mb-5 w-full rounded-xl border border-white/10 bg-surface-900 p-3 text-sm" /><div className="grid gap-4 md:grid-cols-2">{found.map(e => <Panel key={e.id} title={e.title}><p className="text-xs text-brand-400">{e.label || e.subject?.name || kinds[e.kind]}</p><p className="mt-3 whitespace-pre-wrap text-sm text-surface-300">{e.description}</p>{e.starts_on && <p className="mt-2 text-xs text-surface-400">{dateLabel(e.starts_on)}</p>}{e.author && <p className="mt-3 text-xs text-surface-400">Publikuar nga {e.author.name}</p>}<ResourceLink url={e.url}>{section === 'groups' ? 'Hap grupin në WhatsApp' : 'Hap materialin'}</ResourceLink></Panel>)}</div>{!found.length && <Empty>{search ? 'Nuk u gjet asnjë rezultat.' : 'Ende nuk ka përmbajtje të publikuar për ty.'}</Empty>}{section === 'groups' && <div className="mt-6"><Panel title="Aktivitetet ku je regjistruar">{data.enrollments.length ? data.enrollments.map(e => <div key={e.id} className="border-b border-white/10 py-3"><h3 className="text-sm font-medium">{e.activity?.name}</h3><p className="mt-1 text-sm text-surface-400">{e.activity?.description}</p></div>) : <Empty>Ende nuk je regjistruar në aktivitete.</Empty>}</Panel></div>}</>
  }
  return <div><PageHeader title={titles[section]} description="Hapësira jote e mësimit" />{content}</div>
}
