import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, CheckCircle, ListChecks, BookOpen, Bed, Trophy, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export function StudentDashboard({ isBoarding = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [dorm, setDorm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllGrades, setShowAllGrades] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [gradesRes, attendanceRes] = await Promise.all([
          api.studentPortal.grades(),
          api.studentPortal.attendance(),
        ])
        setGrades(gradesRes?.data ?? [])
        setAttendance(attendanceRes?.data ?? null)

        if (isBoarding) {
          api.dormitory.myRoom().then(r => setDorm(r?.data ?? null)).catch(() => {})
        }
      } catch (err) {
        setError('Të dhënat nuk u ngarkuan. Rifreskoni faqen për të provuar përsëri.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isBoarding])

  const availableGrades = grades.map(g => g.final ?? g.term_2 ?? g.term_1).filter(g => g != null).map(Number)
  const avgGrade = availableGrades.length ? availableGrades.reduce((a, b) => a + b, 0) / availableGrades.length : null
  if (loading) return <p role="status" className="p-6 text-surface-300">Duke ngarkuar të dhënat tuaja…</p>
  if (error) return <p role="alert" className="p-6 text-red-400">{error}</p>

  return (
    <div>
      <PageHeader
        title={`Përshëndetje, ${user?.name?.split(' ')[0] || 'Nxënës'}`}
        description={
          isBoarding && dorm?.room
            ? `${user?.class_name || ''} — ${dorm.room.code || ''}`
            : `${user?.class_name || ''} — ID: ${user?.student_id || ''}`
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Mesatarja"
          value={avgGrade ? avgGrade.toFixed(2) : '-'}
          hint={grades.length > 0 ? `${grades.length} lëndë` : 'Nuk ka nota'}
          icon={GraduationCap}
          trend={avgGrade && avgGrade >= 3 ? 'up' : 'down'}
        />
        <StatCard
          label="Mungesa dhe vonesa"
          value={attendance ? (attendance.total_absences + attendance.total_late) : '-'}
          hint={attendance ? `${attendance.total_excused || 0} të arsyetuara` : 'Nuk ka të dhëna'}
          icon={CheckCircle}
        />
        <StatCard
          label="Lëndë me nota"
          value={availableGrades.length}
          hint="Në vitin shkollor të klasës"
          icon={ListChecks}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-body font-medium">Notat e Fundit</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAllGrades(v => !v)}>
              {showAllGrades ? "Shiko më pak" : "Shiko të gjitha"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-0">
            {(showAllGrades ? grades : grades.slice(0, 5)).map((g) => (
              <div key={g.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 text-sm">
                <BookOpen className="h-4 w-4 text-surface-500 shrink-0" />
                <span className="flex-1 text-surface-300">{g.subject || 'Lëndë'}</span>
                <div className="flex gap-2">
                  {g.term_1 && <Badge variant="slate">T1: {g.term_1}</Badge>}
                  {g.term_2 && <Badge variant="slate">T2: {g.term_2}</Badge>}
                  {g.final && <Badge variant="success">{g.final}</Badge>}
                </div>
              </div>
            ))}
            {grades.length === 0 && (
              <p className="text-sm text-surface-400 py-4 text-center">Nuk ka nota të regjistruara ende.</p>
            )}
          </CardContent>
        </Card>

        {/* Dormitory Info (if boarding) */}
        {isBoarding && dorm ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-body font-medium">Dhoma ime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-surface-300">Dhoma</span>
                <span className="text-surface-100 font-medium">
                  {dorm.room?.dorm_block || 'Blloku'} — {dorm.room?.code || '-'}
                </span>
              </div>
              {dorm.roommates?.length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 mb-2">Shokët e dhomës:</p>
                  <div className="flex gap-2">
                    {dorm.roommates.map(rm => (
                      <div key={rm.id} className="flex items-center gap-1.5 rounded-full bg-surface-800 px-3 py-1">
                        <div className="h-5 w-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] font-bold text-brand-400">
                          {rm.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs text-surface-300">{rm.name?.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dorm.weekly_score && (
                <div className="flex items-center justify-between">
                  <span className="text-surface-300">Rezultati Javor</span>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span className={`font-mono text-sm ${dorm.weekly_score.rank <= 3 ? 'text-amber-400' : 'text-surface-300'}`}>
                      #{dorm.weekly_score.rank || '-'} — {dorm.weekly_score.avg_score?.toFixed(1) || '0'}/10
                    </span>
                  </div>
                </div>
              )}
              {dorm.warnings?.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-xs text-red-300">{dorm.warnings.length} paralajmërim(e)</span>
                </div>
              )}
              <Button variant="secondary" className="w-full mt-2" onClick={() => navigate('/dormitory/my-room')}>
                Detajet e Dhomës
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="mb-6" id="my-attendance">
        <CardHeader><CardTitle>Mungesat e mia</CardTitle></CardHeader>
        <CardContent>
          {attendance?.records?.length ? attendance.records.slice(0, 20).map(record => (
            <div key={record.id} className="flex justify-between gap-3 border-b border-white/5 py-2 text-sm">
              <span>{new Date(record.date).toLocaleDateString('sq-AL')}</span>
              <span>{record.status === 'Late' ? 'Vonesë' : 'Mungesë'} — {record.status === 'Excused' || record.absence_type === 'Excused' ? 'E arsyetuar' : record.absence_type === 'Unexcused' ? 'E paarsyetuar' : 'Në shqyrtim'}</span>
            </div>
          )) : <p className="text-sm text-surface-400">Nuk ka mungesa të regjistruara.</p>}
          {attendance?.records?.length > 20 && <p className="mt-2 text-xs text-surface-400">Shfaqen 20 regjistrimet më të fundit.</p>}
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Button variant="secondary" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/timetable')}>
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] font-normal">Orari</span>
        </Button>
        <Button variant="secondary" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/discipline/my-record')}>
          <AlertTriangle className="h-5 w-5" />
          <span className="text-[10px] font-normal">Disiplina</span>
        </Button>
        <Button variant="secondary" className="h-auto py-3 flex-col gap-1" onClick={() => document.getElementById('my-attendance')?.scrollIntoView({ behavior: 'smooth' })}>
          <CheckCircle className="h-5 w-5" />
          <span className="text-[10px] font-normal">Prezenca</span>
        </Button>
        <Button variant="secondary" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/announcements')}>
          <ListChecks className="h-5 w-5" />
          <span className="text-[10px] font-normal">Njoftime</span>
        </Button>
        {isBoarding && (
          <Button variant="secondary" className="h-auto py-3 flex-col gap-1" onClick={() => navigate('/dormitory/my-room')}>
            <Bed className="h-5 w-5" />
            <span className="text-[10px] font-normal">Dhoma</span>
          </Button>
        )}
      </div>
    </div>
  )
}
