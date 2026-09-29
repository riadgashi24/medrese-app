import { Link } from 'react-router-dom'
import { BookOpen, CalendarDays, GraduationCap, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useTeacherWorkspace, coursePath } from '@/pages/teachers/TeacherWorkspace'

export function TeacherDashboard() {
  const { user } = useAuth()
  const query = useTeacherWorkspace()
  const classes = query.data?.classes || []
  const schedule = query.data?.schedule || []
  const today = schedule.filter(s => s.day_of_week === (new Date().getDay() || 7))
  return <div className="space-y-6">
    <PageHeader title={`Përshëndetje, ${user?.name || 'Profesor'}!`} description="Klasat, lëndët dhe orët e tua në një vend" />
    {query.isError && <div role="alert"><p className="mb-3 text-sm text-red-400">Të dhënat nuk u ngarkuan.</p><Button variant="secondary" onClick={() => query.refetch()}>Provo përsëri</Button></div>}
    {query.isPending ? <p role="status">Duke ngarkuar…</p> : query.data && <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Link to="/classes"><StatCard label="Klasat e mia" value={classes.length} hint="Në vitin aktiv shkollor" icon={GraduationCap} /></Link>
        <StatCard label="Lëndë në klasa" value={classes.reduce((sum, c) => sum + c.subjects.length, 0)} hint="Caktimet e mia" icon={BookOpen} />
        <Link to="/timetable"><StatCard label="Orë sot" value={today.length} hint="Sipas orarit mësimor" icon={CalendarDays} /></Link>
        <StatCard label="Nxënës" value={classes.reduce((sum, c) => sum + c.students_count, 0)} hint="Në klasat ku ligjëron" icon={Users} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Orët e sotme</CardTitle><Link to="/timetable" className="text-xs text-brand-400">Orari i plotë →</Link></CardHeader><CardContent>
          {today.map(slot => <Link key={slot.id} to={coursePath(slot.class_id, slot.subject_id)} className="flex items-center gap-5 border-b border-white/10 py-4 hover:text-brand-400">
            <div className="w-20 text-xs text-surface-400"><p>Ora {slot.slot_number}</p>{slot.start_time && <p className="mt-1">{slot.start_time.slice(0, 5)}{slot.end_time ? `–${slot.end_time.slice(0, 5)}` : ''}</p>}</div>
            <div><p className="text-xl font-medium">{slot.class?.name}</p><p className="mt-1 text-xs text-surface-400">{slot.subject?.name}</p></div>
          </Link>)}
          {!today.length && <p className="py-5 text-sm text-surface-400">Sot nuk ka orë në orarin tënd.</p>}
        </CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Klasat e mia</CardTitle><Link to="/classes" className="text-xs text-brand-400">Hap klasat →</Link></CardHeader><CardContent>
          {classes.map(c => <Link key={c.id} to={`/classes/${c.id}`} className="flex items-center justify-between gap-4 border-b border-white/10 py-4"><div><p className="font-medium">{c.name}</p><p className="mt-1 text-xs text-surface-400">{c.subjects.map(s => s.name).join(' · ')}</p></div><span className="text-xs text-brand-400">{c.students_count} nxënës →</span></Link>)}
          {!classes.length && <p className="py-5 text-sm text-surface-400">Administrata ende nuk të ka caktuar lëndë në vitin aktiv.</p>}
        </CardContent></Card>
      </div>
    </>}
  </div>
}
