import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, CalendarCheck, NotebookPen, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const DAYS_AL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SQ = { Monday: 'E Hënë', Tuesday: 'E Martë', Wednesday: 'E Mërkurë', Thursday: 'E Enjte', Friday: 'E Premte', Saturday: 'E Shtunë' }

const periodTimes = [
  '07:30', '08:20', '09:10', '10:00', '10:50', '11:40', '12:30'
]

export function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState([])
  const [todaySlots, setTodaySlots] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [scheduleRes, todayRes] = await Promise.all([
          api.teacher.schedule(),
          api.teacher.today(),
        ])
        setSchedule(scheduleRes?.data ?? [])
        setTodaySlots(todayRes?.data ?? [])
      } catch (err) {
        console.error('Failed to load teacher data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const todaySQ = DAYS_SQ[todayName] || todayName

  const lessonCount = todaySlots.length

  return (
    <div>
      <PageHeader
        title="Paneli i Mësuesit"
        description={`${user?.name || 'Mësues'} — ${lessonCount} orë sot`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Orët Sot" value={lessonCount} hint={todaySQ} icon={BookOpen} />
        <StatCard label="Klasat" value={schedule.length || '-'} hint="Gjithsej gjatë javës" icon={CalendarCheck} />
        <StatCard label="Orët Java" value={schedule.reduce((sum, d) => sum + d.slots.length, 0)} hint="Totali Javor" icon={NotebookPen} />
        <StatCard label="Orari Javor" value="7 Perioda" hint="Nga e hëna në të shtunë" icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Orët e Sotme — {todaySQ}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-surface-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
              </div>
            ) : todaySlots.length === 0 ? (
              <p className="text-sm text-surface-400 py-4 text-center">Sot nuk keni orë mësimi.</p>
            ) : (
              todaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 py-3 border-b border-white/5 text-sm group hover:bg-white/3 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  onClick={() => {
                    if (slot.class_id) {
                      navigate(`/classes/${slot.class_id}`)
                    }
                  }}
                >
                  <div className="flex flex-col items-center w-14 shrink-0">
                    <span className="font-mono text-[10px] text-brand-400">{periodTimes[slot.slot_number - 1] || slot.slot_number}</span>
                    <span className="font-mono text-[9px] text-surface-500">Perioda {slot.slot_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-100 font-medium truncate">{slot.subject_name || 'Lëndë'}</p>
                    <p className="text-[11px] text-surface-400">{slot.class_name || 'Klasa'}</p>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/classes/${slot.class_id}/attendance/take`) }}>
                      Prezenca
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/classes/${slot.class_id}/grades`) }}>
                      Notat
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weekly Schedule Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Orari Javor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-surface-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
              </div>
            ) : (
              <div className="space-y-3">
                {DAYS_AL.map((day) => {
                  const dayData = schedule.find(d => d.day === day)
                  const slots = dayData?.slots ?? []
                  return (
                    <div key={day} className="flex items-center gap-3 text-sm">
                      <span className={`w-20 text-xs font-mono shrink-0 ${day === todayName ? 'text-brand-400' : 'text-surface-500'}`}>
                        {DAYS_SQ[day]}
                      </span>
                      <div className="flex-1 flex gap-1 flex-wrap">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map(period => {
                          const hasSlot = slots.some(s => s.slot_number === period)
                          return (
                            <div
                              key={period}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-mono transition-colors ${
                                hasSlot
                                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                                  : 'bg-surface-800/50 text-surface-600 border border-white/5'
                              }`}
                              title={hasSlot ? `${slots.find(s => s.slot_number === period)?.subject_name || 'Lëndë'} - ${slots.find(s => s.slot_number === period)?.class_name || 'Klasa'}` : 'Bosh'}
                            >
                              {period}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">Veprime të Shpejta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="secondary" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/timetable')}>
              <Clock className="h-5 w-5" />
              <span className="text-xs font-normal">Orari i Plotë</span>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/subjects')}>
              <BookOpen className="h-5 w-5" />
              <span className="text-xs font-normal">Lëndët</span>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/students')}>
              <NotebookPen className="h-5 w-5" />
              <span className="text-xs font-normal">Nxënësit</span>
            </Button>
            <Button variant="secondary" className="h-auto py-4 flex-col gap-1" onClick={() => navigate('/classes')}>
              <ArrowRight className="h-5 w-5" />
              <span className="text-xs font-normal">Klasat e Mia</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
