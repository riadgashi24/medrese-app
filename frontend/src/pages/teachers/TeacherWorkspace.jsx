import { useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, BookOpen, CalendarDays, ClipboardList, GraduationCap, Plus, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

const days = ['E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë', 'E diel']
const attendanceLabels = { Present: 'I pranishëm', Absent: 'Mungesë', Late: 'Vonesë' }
const localDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const displayDate = value => value ? String(value).slice(0, 10).split('-').reverse().join('.') : 'Pa datë'
export const coursePath = (classId, subjectId) => `/teacher/classes/${classId}/subjects/${subjectId}`
const studentName = student => `${student.first_name} ${student.last_name}`

function errorMessage(error) {
  try {
    const data = JSON.parse(error.message)
    return Object.values(data.errors || {}).flat().join(' ') || data.message
  } catch { return 'Veprimi dështoi. Provo përsëri.' }
}

export function useTeacherWorkspace() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['teacher-workspace', user?.id],
    queryFn: () => api.teacherWorkspace.index().then(r => r.data),
    enabled: user?.role === 'teacher',
  })
}

function Section({ title, children, action }) {
  return <Card>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
      <CardTitle className="text-base">{title}</CardTitle>{action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
}

function Empty({ children }) { return <p className="py-6 text-sm text-surface-400">{children}</p> }
function ErrorNotice({ error }) { return error ? <p role="alert" className="my-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</p> : null }

function QueryState({ query, children }) {
  if (query.isPending) return <p role="status" className="py-8 text-sm text-surface-400">Duke ngarkuar…</p>
  if (query.isError) return <div role="alert" className="py-6"><p className="mb-3 text-sm text-red-400">{errorMessage(query.error)}</p><Button variant="secondary" onClick={() => query.refetch()}>Provo përsëri</Button></div>
  return children
}

export function TeacherClassesPage() {
  const { user } = useAuth()
  const query = useTeacherWorkspace()
  const [search, setSearch] = useState('')
  if (user?.role !== 'teacher') return <Navigate to="/dashboard" replace />
  const classes = (query.data?.classes || []).filter(c => `${c.name} ${c.subjects.map(s => s.name).join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-5">
    <PageHeader title="Klasat e mia" description="Klasat dhe lëndët që ligjëron në vitin aktiv shkollor" />
    <Input aria-label="Kërko klasë ose lëndë" placeholder="Kërko klasë ose lëndë…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
    <QueryState query={query}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map(c => <Link key={c.id} to={`/classes/${c.id}`} className="rounded-2xl border border-white/10 bg-surface-900/60 p-6 transition-colors hover:border-brand-500/50">
          <div className="flex items-center justify-between"><h2 className="text-3xl font-semibold">{c.name}</h2><GraduationCap className="h-6 w-6 text-brand-400" /></div>
          <p className="mt-2 text-xs text-surface-400">{c.academic_year?.label}</p>
          <div className="my-5 flex flex-wrap gap-2">{c.subjects.map(s => <Badge key={s.id} variant="blue">{s.name}</Badge>)}</div>
          <div className="flex items-center justify-between text-sm text-surface-400"><span>{c.students_count} nxënës</span><span className="text-brand-400">Hap {c.subjects.length === 1 ? 'lëndën' : 'klasën'} →</span></div>
        </Link>)}
      </div>
      {!classes.length && <Empty>{search ? 'Nuk u gjet klasë ose lëndë.' : 'Ende nuk ke lëndë të caktuara në vitin aktiv. Caktimet bëhen nga administrata.'}</Empty>}
    </QueryState>
  </div>
}

export function TeacherClassPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const query = useTeacherWorkspace()
  if (user?.role !== 'teacher') return <Navigate to="/dashboard" replace />
  const selected = query.data?.classes.find(c => String(c.id) === id)
  if (selected?.subjects.length === 1) return <Navigate to={coursePath(id, selected.subjects[0].id)} replace />
  return <div className="space-y-5">
    <Link to="/classes" className="inline-flex items-center gap-2 text-sm text-brand-400"><ArrowLeft size={16} />Klasat e mia</Link>
    <PageHeader title={selected ? `Klasa ${selected.name}` : 'Lëndët e klasës'} description="Zgjidh lëndën që do të hapësh" />
    <QueryState query={query}>
      {!selected ? <Empty>Kjo klasë nuk është pjesë e caktimeve tuaja në vitin aktiv.</Empty> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selected.subjects.map(s => <Link key={s.id} to={coursePath(id, s.id)} className="rounded-2xl border border-white/10 bg-surface-900/60 p-6 hover:border-brand-500/50">
          <BookOpen className="mb-4 h-6 w-6 text-brand-400" /><h2 className="text-xl font-medium">{s.name}</h2>
          <p className="mt-3 text-sm text-surface-400">{s.pivot?.weekly_hours || 0} orë në javë · {selected.students_count} nxënës</p>
          <p className="mt-5 text-sm text-brand-400">Notat, njoftimet, detyrat dhe orët →</p>
        </Link>)}
      </div>}
    </QueryState>
  </div>
}

function PeriodGrades({ data, refresh }) {
  const [editing, setEditing] = useState(null)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  function edit(student, period) {
    const current = data.grades.find(g => g.student_id === student.id && g.period === period.id)
    setEditing({ student, period }); setValue(current?.grade ?? ''); setError(''); setSaved('')
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api.teacherWorkspace.grade(data.class.id, data.subject.id, { student_id: editing.student.id, period: editing.period.id, grade: Number(value) })
      await refresh(); setSaved(`Nota e ${studentName(editing.student)} u ruajt.`); setEditing(null)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Section title="Notat dymujore">
    <p className="mb-5 text-sm text-surface-400">Një notë nga 1 deri në 5 për secilën periudhë. Kliko një qelizë për ta shtuar ose korrigjuar. Këto nota shfaqen edhe te nxënësi; nota përfundimtare regjistrohet veçmas.</p>
    {saved && <p role="status" className="mb-4 text-sm text-brand-400">{saved}</p>}
    {editing && <form onSubmit={save} className="mb-5 rounded-xl border border-brand-500/30 bg-brand-500/5 p-4">
      <p className="mb-3 text-sm font-medium">{studentName(editing.student)} · {editing.period.label}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Nota<Select autoFocus aria-label="Nota për periudhën" required value={value} onChange={e => setValue(e.target.value)} className="mt-1 w-32"><option value="">Zgjidh</option>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</Select></label>
        <Button type="submit" disabled={busy}>Ruaj notën</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(null)}>Anulo</Button>
      </div><ErrorNotice error={error} />
    </form>}
    <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
      <thead><tr className="border-b border-white/10"><th className="p-3">Nxënësi</th>{data.periods.map(p => <th key={p.id} className="p-3 text-center text-xs font-medium">{p.label}</th>)}</tr></thead>
      <tbody>{data.students.map(s => <tr key={s.id} className="border-b border-white/5"><th className="p-3 font-normal">{studentName(s)}</th>{data.periods.map(p => {
        const grade = data.grades.find(g => g.student_id === s.id && g.period === p.id)
        return <td key={p.id} className="p-2 text-center"><button disabled={busy} onClick={() => edit(s, p)} aria-label={`${studentName(s)}, ${p.label}, ${grade?.grade ?? 'pa notë'}`} className={`h-10 w-14 rounded-lg border hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500 ${grade ? 'border-brand-500/20 bg-brand-500/10 text-brand-400' : 'border-white/10 text-surface-400'}`}>{grade?.grade ?? '+'}</button></td>
      })}</tr>)}</tbody>
    </table></div>
    {!data.students.length && <Empty>Nuk ka nxënës aktivë në këtë klasë.</Empty>}
  </Section>
}

function Publications({ data, kind, refresh }) {
  const [form, setForm] = useState(null)
  const [filter, setFilter] = useState('active')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const assignment = kind === 'assignment'
  const entries = assignment ? data.assignments.filter(a => filter === 'all' || (filter === 'completed' ? Boolean(a.completed_at) : !a.completed_at)) : data.announcements
  async function publish(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api.teacherWorkspace.publish(data.class.id, data.subject.id, { ...form, kind, date: form.date || null })
      await refresh(); setForm(null)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  async function complete(item) {
    setBusy(true); setError('')
    try { await api.teacherWorkspace.completeAssignment(data.class.id, data.subject.id, item.id, !item.completed_at); await refresh() }
    catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Section title={assignment ? 'Detyrat e klasës' : 'Njoftimet për këtë lëndë'} action={<Button size="sm" disabled={busy} onClick={() => { setForm({ title: '', description: '', date: '' }); setError('') }}><Plus size={16} />{assignment ? 'Shto detyrë' : 'Shto njoftim'}</Button>}>
    <p className="mb-4 text-sm text-surface-400">{assignment ? 'Afati i detyrës shfaqet në kalendarin e nxënësve. Detyra mbetet aktive deri sa ta shënosh të përfunduar.' : 'Njoftimi u shfaqet nxënësve të kësaj klase. Nëse cakton datë, shfaqet edhe në kalendarin e tyre.'}</p>
    <ErrorNotice error={error} />
    {form && <form onSubmit={publish} className="mb-5 space-y-4 rounded-xl border border-brand-500/30 p-4">
      <label className="block text-sm">Titulli<Input autoFocus required maxLength={255} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></label>
      <label className="block text-sm">Përshkrimi<textarea required maxLength={10000} rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-surface-900/60 p-3" /></label>
      <label className="block text-sm">{assignment ? 'Afati i dorëzimit' : 'Data në kalendar (opsionale)'}<Input type="date" required={assignment} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1 max-w-xs" /></label>
      <div className="flex gap-2"><Button disabled={busy} type="submit">{busy ? 'Duke publikuar…' : 'Publiko'}</Button><Button disabled={busy} type="button" variant="ghost" onClick={() => setForm(null)}>Anulo</Button></div>
    </form>}
    {assignment && <div className="mb-5 flex flex-wrap gap-2">{[['active', 'Aktive'], ['completed', 'Të përfunduara'], ['all', 'Të gjitha']].map(([key, label]) => <Button key={key} size="sm" variant={filter === key ? 'default' : 'secondary'} onClick={() => setFilter(key)}>{label}</Button>)}</div>}
    <div className="space-y-3">{entries.map(item => <article key={item.id} className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="font-medium">{item.title}</h3>{assignment && <Badge variant={item.completed_at ? 'success' : 'blue'}>{item.completed_at ? 'E përfunduar' : 'Aktive'}</Badge>}</div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-surface-300">{item.description}</p>
      {(item.due_date || item.starts_on) && <p className="mt-3 text-xs text-surface-400">{assignment ? 'Afati' : 'Në kalendar'}: {displayDate(item.due_date || item.starts_on)}</p>}
      {assignment && <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-surface-400">{item.submitted_count} dorëzime të regjistruara{!item.completed_at && item.due_date?.slice(0, 10) < localDate() ? ' · Afati ka kaluar' : ''}</span><Button size="sm" variant="secondary" disabled={busy} onClick={() => complete(item)}>{item.completed_at ? 'Rihap detyrën' : 'Shëno të përfunduar'}</Button></div>}
    </article>)}</div>
    {!entries.length && <Empty>{assignment ? 'Nuk ka detyra në këtë kategori.' : 'Ende nuk ka njoftime për këtë lëndë.'}</Empty>}
  </Section>
}

function Lessons({ data, refresh }) {
  const [form, setForm] = useState(null)
  const [roster, setRoster] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  function open(lesson) {
    setError('')
    const pupils = lesson ? lesson.attendances.map(a => ({ id: a.student_id, ...a.student })) : data.students
    setRoster(pupils)
    setForm({ id: lesson?.id, title: lesson?.title || '', lesson_date: lesson?.lesson_date?.slice(0, 10) || localDate(), slot_number: lesson?.slot_number || '',
      attendance: pupils.map(s => ({ student_id: s.id, status: lesson?.attendances.find(a => a.student_id === s.id)?.status || 'Present' })) })
  }
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      await api.teacherWorkspace.saveLesson(data.class.id, data.subject.id, { title: form.title, lesson_date: form.lesson_date, slot_number: Number(form.slot_number), attendance: form.attendance }, form.id)
      await refresh(); setForm(null)
    } catch (err) { setError(errorMessage(err)) } finally { setBusy(false) }
  }
  return <Section title="Orët e mbajtura" action={<Button size="sm" disabled={busy || !data.students.length} onClick={() => open(null)}><Plus size={16} />Regjistro orë</Button>}>
    <ErrorNotice error={error} />
    {!data.students.length && <p className="mb-4 text-sm text-surface-400">Për të regjistruar orë, klasa duhet të ketë nxënës aktivë të caktuar.</p>}
    {form && <form onSubmit={save} className="mb-6 space-y-4 rounded-xl border border-brand-500/30 p-4">
      <h3 className="font-medium">{form.id ? 'Korrigjo orën' : 'Ora e mbajtur'}</h3>
      <label className="block text-sm">Titulli i mësimit<Input autoFocus required maxLength={255} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Data<Input type="date" required max={localDate()} value={form.lesson_date} onChange={e => setForm({ ...form, lesson_date: e.target.value })} className="mt-1" /></label><label className="text-sm">Numri i orës në ditë<Input type="number" required min={1} max={12} value={form.slot_number} onChange={e => setForm({ ...form, slot_number: e.target.value })} className="mt-1" /></label></div>
      <p className="text-sm text-surface-400">Kontrollo listën dhe shëno mungesat ose vonesat për këtë orë.</p>
      <div className="max-h-96 overflow-y-auto rounded-lg border border-white/10">{roster.map(s => <div key={s.id} className="flex items-center justify-between gap-3 border-b border-white/5 p-3"><span className="text-sm">{studentName(s)}</span><Select aria-label={`Prezenca e ${studentName(s)}`} className="w-40 shrink-0" value={form.attendance.find(a => a.student_id === s.id)?.status} onChange={e => setForm({ ...form, attendance: form.attendance.map(a => a.student_id === s.id ? { ...a, status: e.target.value } : a) })}>{Object.entries(attendanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></div>)}</div>
      <div className="flex gap-2"><Button disabled={busy} type="submit">{busy ? 'Duke ruajtur…' : 'Ruaj orën dhe prezencën'}</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => setForm(null)}>Anulo</Button></div>
    </form>}
    <div className="space-y-3">{data.lessons.map(lesson => <details key={lesson.id} className="rounded-xl border border-white/10 p-4">
      <summary className="cursor-pointer"><span className="font-medium">{lesson.title}</span><span className="mt-2 block text-xs text-surface-400">{displayDate(lesson.lesson_date)} · Ora {lesson.slot_number} · {lesson.attendances.filter(a => a.status === 'Absent').length} mungesa · {lesson.attendances.filter(a => a.status === 'Late').length} vonesa</span></summary>
      <div className="mt-4 space-y-2">{lesson.attendances.map(a => <div key={a.id} className="flex justify-between gap-3 text-sm"><span>{a.student ? studentName(a.student) : 'Nxënës'}</span><Badge variant={a.status === 'Present' ? 'success' : a.status === 'Late' ? 'warning' : 'danger'}>{attendanceLabels[a.status]}</Badge></div>)}</div>
      <Button className="mt-4" size="sm" variant="secondary" disabled={busy} onClick={() => open(lesson)}>Korrigjo orën / prezencën</Button>
    </details>)}</div>
    {!data.lessons.length && <Empty>Ende nuk ka orë të regjistruara për këtë lëndë.</Empty>}
  </Section>
}

export function TeacherCoursePage() {
  const { classId, subjectId } = useParams()
  const { user } = useAuth()
  const client = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'grades'
  const query = useQuery({ queryKey: ['teacher-course', user?.id, classId, subjectId], queryFn: () => api.teacherWorkspace.course(classId, subjectId).then(r => r.data), enabled: user?.role === 'teacher' })
  if (user?.role !== 'teacher') return <Navigate to="/dashboard" replace />
  async function refresh() {
    await client.invalidateQueries({ queryKey: ['teacher-course', user?.id, classId, subjectId] })
    await Promise.all(['student-portal', 'student-inbox', 'student'].map(key => client.invalidateQueries({ queryKey: [key] })))
  }
  const data = query.data
  return <div className="space-y-5">
    <Link to="/classes" className="inline-flex items-center gap-2 text-sm text-brand-400"><ArrowLeft size={16} />Klasat e mia</Link>
    <PageHeader title={data ? `${data.class.name} · ${data.subject.name}` : 'Hapësira e lëndës'} description={data ? `${data.class.academic_year?.label || ''} · ${data.students.length} nxënës` : ''} />
    <QueryState query={query}>{data && <>
      <nav aria-label="Seksionet e lëndës" className="flex flex-wrap gap-2">{[['grades', 'Notat', GraduationCap], ['announcements', 'Njoftimet', CalendarDays], ['assignments', 'Detyrat', ClipboardList], ['lessons', 'Orët', BookOpen]].map(([key, label, Icon]) => <Button key={key} variant={tab === key ? 'default' : 'secondary'} aria-pressed={tab === key} onClick={() => setSearchParams({ tab: key })}><Icon size={16} />{label}</Button>)}</nav>
      {tab === 'grades' && <PeriodGrades key={`${classId}-${subjectId}`} data={data} refresh={refresh} />}
      {tab === 'announcements' && <Publications key={`announcement-${classId}-${subjectId}`} data={data} kind="announcement" refresh={refresh} />}
      {tab === 'assignments' && <Publications key={`assignment-${classId}-${subjectId}`} data={data} kind="assignment" refresh={refresh} />}
      {tab === 'lessons' && <Lessons key={`${classId}-${subjectId}`} data={data} refresh={refresh} />}
      {!['grades', 'announcements', 'assignments', 'lessons'].includes(tab) && <Empty>Zgjidh një seksion më sipër.</Empty>}
    </>}</QueryState>
  </div>
}

export function TeacherSchedulePage() {
  const { user } = useAuth()
  const query = useTeacherWorkspace()
  if (user?.role !== 'teacher') return <Navigate to="/dashboard" replace />
  const slots = query.data?.schedule || []
  const periods = [...new Set(slots.map(s => s.slot_number))].sort((a, b) => a - b)
  const visibleDays = days.map((label, index) => ({ label, day: index + 1 })).filter(d => d.day <= 5 || slots.some(s => s.day_of_week === d.day))
  return <div className="space-y-5"><PageHeader title="Orari im mësimor" description="Klasa dhe lënda për secilën orë të javës" /><QueryState query={query}><Section title="Orari javor">
    {slots.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed border-collapse text-left">
      <thead><tr><th className="w-20 p-3 text-xs text-surface-400">Ora</th>{visibleDays.map(d => <th key={d.day} className={`p-3 text-sm font-medium ${d.day === (new Date().getDay() || 7) ? 'text-brand-400' : ''}`}>{d.label}</th>)}</tr></thead>
      <tbody>{periods.map(period => <tr key={period} className="border-t border-white/10"><th className="p-3 text-sm font-medium">{period}</th>{visibleDays.map(d => {
        const slot = slots.find(s => s.slot_number === period && s.day_of_week === d.day)
        return <td key={d.day} className="p-2 align-top">{slot ? <Link to={coursePath(slot.class_id, slot.subject_id)} className="block min-h-28 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3 hover:bg-brand-500/10"><p className="text-xl font-semibold">{slot.class?.name}</p><p className="mt-1 text-xs text-surface-400">{slot.subject?.name}</p>{slot.start_time && <p className="mt-3 text-[11px] text-brand-400">{slot.start_time.slice(0, 5)}{slot.end_time ? `–${slot.end_time.slice(0, 5)}` : ''}</p>}</Link> : <span className="block p-3 text-surface-500">—</span>}</td>
      })}</tr>)}</tbody>
    </table></div> : <Empty>Administrata ende nuk ka caktuar orar për ty në vitin aktiv.</Empty>}
  </Section></QueryState></div>
}

export function TeacherHomeroomPage() {
  const { user } = useAuth()
  if (user?.role !== 'teacher') return <Navigate to="/dashboard" replace />
  return <div><PageHeader title="Kujdestari" description="Hapësira e kujdestarit të klasës" /><Section title="Në zhvillim të ardhshëm"><Users className="mb-4 h-8 w-8 text-brand-400" /><Badge variant="slate">Në plan</Badge><Empty>Funksionet e kujdestarisë do të zhvillohen në hapin e ardhshëm.</Empty></Section></div>
}
