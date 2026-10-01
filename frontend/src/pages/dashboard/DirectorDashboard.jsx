import { Users, Bed, GraduationCap, CheckCircle, ArrowUpRight, CalendarDays, BookOpen, FileBadge, Megaphone, Loader2, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent } from '@/components/ui/Card'
import { AttendanceBarChart, FeePieChart } from '@/components/charts/Charts'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import logo from '@/assets/logo.png'

const shortcuts = [
  { title: 'Klasat & nxënësit', description: 'Regjistri dhe organizimi i klasave', path: '/classes', icon: BookOpen },
  { title: 'Kujdestaria & dëftesat', description: 'Notat përfundimtare dhe raportet', path: '/teacher/homeroom', icon: FileBadge },
  { title: 'Orari mësimor', description: 'Lëndët dhe angazhimi i profesorëve', path: '/timetable', icon: CalendarDays },
  { title: 'Njoftimet', description: 'Komunikimi me komunitetin shkollor', path: '/announcements', icon: Megaphone },
]
const dayNames = { Mon: 'Hën', Tue: 'Mar', Wed: 'Mër', Thu: 'Enj', Fri: 'Pre', Sat: 'Sht', Sun: 'Die' }

export function DirectorDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  async function loadDashboard() {
    setLoading(true); setError(false)
    try { setDashboard(await api.dashboard.principal()) }
    catch { setError(true) }
    finally { setLoading(false) }
  }
  useEffect(() => { loadDashboard() }, [])
  const value = key => loading ? '…' : dashboard?.stats?.[key] ?? '—'
  const today = new Date()
  const date = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
  const chart = (dashboard?.charts?.attendance_overview || []).map(row => ({ ...row, day: dayNames[row.day] || row.day }))
  const activity = dashboard?.recent_activity || []
  const pending = dashboard?.stats?.approvals
  return <div className="director-dashboard space-y-6">
    <section className="school-hero">
      <div className="school-hero-pattern" aria-hidden="true" />
      <div className="relative z-10 max-w-xl">
        <p className="hero-eyebrow">MEDRESEJA ALAUDDIN · PRISHTINË</p>
        <h1>Një vështrim mbi<br /><span>jetën e shkollës.</span></h1>
        <p className="hero-description">Mirë se erdhët, {user?.name || 'Drejtor'}. Nxënësit, mësimi dhe puna e përditshme, në një vend.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/reports" className="hero-primary">Shiko raportet <ArrowUpRight size={17} /></Link><Link to="/timetable" className="hero-secondary"><CalendarDays size={16} /> Orari mësimor</Link></div>
      </div>
      <div className="hero-identity" aria-hidden="true"><img src={logo} alt="" /><span>DIJE · EDUKIM · PËRKUSHTIM</span></div>
      <span className="hero-date"><CalendarDays size={14} />{date}</span>
    </section>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-400/30 p-4 text-sm text-red-400">Të dhënat nuk u ngarkuan.<button onClick={loadDashboard} className="flex items-center gap-2 underline"><RefreshCw size={15} />Provo përsëri</button></div>}
    <div className="dashboard-section-heading"><div><span className="section-label">PËRMBLEDHJE</span><h2>Shkolla në shifra</h2></div><span className="text-xs text-surface-400">Të dhënat e regjistruara në sistem</span></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
      <StatCard label="Nxënës" value={value('total_students')} hint="Komuniteti ynë shkollor" icon={Users} />
      <StatCard label="Konviktorë" value={value('boarding')} hint="Nxënës në konvikt" icon={Bed} />
      <StatCard label="Stafi" value={value('total_staff')} hint="Stafi i regjistruar" icon={GraduationCap} />
      <StatCard label="Kërkesa në pritje" value={value('approvals')} hint={pending === 0 ? 'Nuk ka kërkesa në pritje' : 'Në pritje të konfirmimit'} icon={CheckCircle} />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card className="min-w-0"><div className="dashboard-section-heading mb-6"><div><span className="section-label">PJESËMARRJA</span><h2>Frekuentimi gjatë javës</h2></div><span className="dashboard-chip">7 ditët e fundit</span></div><CardContent>{loading ? <Loading /> : <AttendanceBarChart data={chart} height={230} />}</CardContent><p className="mt-4 border-t border-white/10 pt-3 text-xs text-surface-400">Përqindja e pranisë sipas evidencës së frekuentimit.</p></Card>
      <Card><div className="dashboard-section-heading mb-4"><div><span className="section-label">SOT</span><h2>Prania në shkollë</h2></div></div>{loading ? <Loading /> : <FeePieChart data={dashboard?.charts?.today_attendance || []} />}</Card>
    </div>
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card><div className="dashboard-section-heading mb-5"><div><span className="section-label">PUNA E PËRDITSHME</span><h2>Qasje e shpejtë</h2></div></div><div className="grid gap-3 sm:grid-cols-2">{shortcuts.map(({ title, description, path, icon: Icon }) => <Link key={path} to={path} className="dashboard-shortcut"><span className="shortcut-icon"><Icon size={21} /></span><div className="min-w-0 flex-1"><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={17} className="shrink-0" /></Link>)}</div></Card>
      <Card><div className="dashboard-section-heading mb-5"><div><span className="section-label">NGA SHKOLLA</span><h2>Njoftimet e fundit</h2></div><Link to="/announcements" aria-label="Shiko të gjitha njoftimet" className="text-brand-400"><ArrowUpRight size={20} /></Link></div>{loading ? <Loading /> : activity.length ? <div className="announcement-timeline">{activity.map(item => <Link to="/announcements" key={item.id} className="timeline-entry"><span className="timeline-dot" /><h3>{item.title}</h3><p>{item.user} · {item.time}</p></Link>)}</div> : <div className="dashboard-empty"><Megaphone size={26} /><p>Ende nuk ka njoftime të publikuara.</p><Link to="/announcements">Hap njoftimet <ArrowUpRight size={14} /></Link></div>}</Card>
    </div>
    <footer className="dashboard-footer"><span>Medreseja Alauddin</span><span>Administrimi shkollor · Prishtinë</span></footer>
  </div>
}
function Loading() { return <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-surface-400"><Loader2 size={18} className="animate-spin" />Duke ngarkuar…</div> }
