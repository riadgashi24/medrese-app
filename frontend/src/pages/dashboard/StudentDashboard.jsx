import { lessonDate, sortedLessons } from '@/pages/students/Lessons'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCircle, GraduationCap, ListChecks } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { AssignmentList, Schedule, Panel, Empty, LoadError, usePortal, useInbox, portalLinks, calendarEvents, dateLabel, dateKey, kinds } from '@/pages/students/StudentPortal'

export function StudentDashboard({ isBoarding = false }) {
  const { user } = useAuth()
  const portal = usePortal()
  const inbox = useInbox()
  const grades = useQuery({ queryKey: ['student', 'grades', user?.id], queryFn: () => api.studentPortal.grades().then(r => r.data) })
  const attendance = useQuery({ queryKey: ['student', 'attendance', user?.id], queryFn: () => api.studentPortal.attendance().then(r => r.data) })
  const dorm = useQuery({ queryKey: ['student-room', user?.id], queryFn: () => api.dormitory.myRoom().then(r => r.data), enabled: isBoarding })
  const scores = (grades.data || []).map(g => g.final ?? g.term_2 ?? g.term_1 ?? g.period_average).filter(g => g != null).map(Number)
  const average = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '—'
  const pending = (portal.data?.assignments || []).filter(a => !a.completed_at && !a.submissions.some(s => ['Submitted', 'Graded'].includes(s.status)))
  const upcoming = calendarEvents(portal.data).filter(e => (e.ends_on || e.starts_on) >= dateKey(new Date())).sort((a, b) => a.starts_on.localeCompare(b.starts_on)).slice(0, 5)
  const lessons = sortedLessons(portal.data?.entries || [])
  const latestDate = lessons.length ? lessonDate(lessons[0]) : ''
  const latestLessons = lessons.filter(e => lessonDate(e) === latestDate)
  const unread = inbox.data?.filter(n => !n.read).length
  return <div className="space-y-6">
    <PageHeader title={`Përshëndetje, ${user?.name?.split(' ')[0] || 'Nxënës'}!`} description={`${user?.class_name || 'Hapësira jote'} · ${dateLabel(dateKey(new Date()))}`} />
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <Link to="/student/grades"><StatCard label="Mesatarja ime" value={average} hint={`${scores.length} lëndë me nota`} icon={GraduationCap} /></Link>
      <Link to="/student/assignments"><StatCard label="Detyra për t’u kryer" value={portal.data ? pending.length : '—'} hint="Kontrollo afatet dhe udhëzimet" icon={ListChecks} /></Link>
      <Link to="/student/attendance"><StatCard label="Mungesa dhe vonesa" value={attendance.data ? Number(attendance.data.total_absences || 0) + Number(attendance.data.total_late || 0) : '—'} hint={attendance.data ? `${attendance.data.total_excused || 0} të arsyetuara` : 'Prezenca ime'} icon={CheckCircle} /></Link>
      <Link to="/student/notifications"><StatCard label="Njoftime të palexuara" value={unread ?? '—'} hint="Të rejat që të përkasin" icon={Bell} /></Link>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">{portalLinks.map(([key, label, Icon]) => <Link key={key} to={`/student/${key}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface-900/60 p-3 text-sm transition-colors hover:border-brand-500/40 hover:text-brand-400"><Icon className="h-4 w-4 shrink-0" />{label}</Link>)}</div>
    {[portal, grades, attendance, inbox].filter(q => q.isError).length > 0 && <LoadError retry={() => Promise.all([portal.refetch(), grades.refetch(), attendance.refetch(), inbox.refetch()])} />}
    {portal.isPending ? <Empty>Duke ngarkuar ditën tënde…</Empty> : portal.data && <>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]"><Panel title="Detyrat që kërkojnë vëmendje" to="/student/assignments"><AssignmentList items={pending.slice(0, 3)} /></Panel><Panel title="Orari i sotëm" to="/student/timetable"><Schedule slots={portal.data.schedule} compact /></Panel></div>
      <div className="grid gap-5 lg:grid-cols-2"><Panel title="Në kalendar" to="/student/calendar">{upcoming.length ? upcoming.map(e => <div key={e.id} className="flex items-start gap-4 border-b border-white/10 py-3"><div className="w-24 shrink-0 text-xs text-brand-400">{dateLabel(e.starts_on)}</div><div><p className="text-sm font-medium">{e.title}</p><p className="mt-1 text-xs text-surface-400">{kinds[e.kind]} {e.subject?.name && `· ${e.subject.name}`}</p></div></div>) : <Empty>Nuk ka afate ose ngjarje të ardhshme.</Empty>}</Panel><Panel title={latestDate ? `Mësimet · ${dateLabel(latestDate)}` : 'Mësimet e fundit'} to="/student/lessons">{latestLessons.map(e => <Link key={e.id} to={`/student/lessons?date=${latestDate}`} className="block border-b border-white/10 py-3"><p className="text-xs text-brand-400">{e.subject?.name}</p><p className="mt-1 text-sm">{e.title}</p><p className="mt-1 text-xs text-surface-400">{e.author?.name}</p></Link>)}{!portal.data.entries.some(e => e.kind === 'lesson') && <Empty>Profesorët ende nuk kanë publikuar mësime.</Empty>}</Panel></div>
    </>}
    <div className="grid gap-5 lg:grid-cols-2"><Panel title="Suksesi im" to="/student/grades">{(grades.data || []).slice(0, 5).map(g => <div key={g.id} className="flex justify-between gap-3 border-b border-white/10 py-3 text-sm"><span>{g.subject}</span><Badge variant="success">{g.final ?? g.term_2 ?? g.term_1 ?? g.period_average ?? '—'}</Badge></div>)}{grades.data?.length === 0 && <Empty>Notat do të shfaqen sapo të regjistrohen.</Empty>}</Panel><Panel title="Njoftimet e fundit" to="/student/notifications">{inbox.data?.slice(0, 5).map(n => <Link key={n.key} to="/student/notifications" className="block border-b border-white/10 py-3"><p className={`text-sm ${!n.read ? 'text-brand-300' : ''}`}>{n.title}</p><p className="mt-1 text-xs text-surface-400">{dateLabel(n.date)}</p></Link>)}{inbox.data?.length === 0 && <Empty>Nuk ka njoftime të reja.</Empty>}</Panel></div>
    {isBoarding && dorm.data?.room && <Panel title="Dhoma ime" to="/dormitory/my-room"><p className="text-sm">{dorm.data.room.dorm_block} · {dorm.data.room.code}</p><p className="mt-2 text-xs text-surface-400">{dorm.data.roommates?.map(r => r.name).join(', ')}</p></Panel>}
    <Link to="/student/quizzes" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 p-5"><div><h3 className="text-sm font-medium">Kuize online</h3><p className="mt-1 text-xs text-surface-400">Një hapësirë e ardhshme për ushtrime dhe vlerësime nga profesorët.</p></div><Badge variant="slate">Në plan</Badge></Link>
  </div>
}
