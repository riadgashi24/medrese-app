import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, Label } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'

const STATUSES = ['Present', 'Absent', 'Late']
const statusConfig = {
  Present: { label: 'P', text: 'Prezent', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', badge: 'success' },
  Absent: { label: 'M', text: 'Mungon', color: 'bg-red-500/20 text-red-400 border-red-500/30', badge: 'red' },
  Late: { label: 'V', text: 'Vonesë', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', badge: 'amber' },
}

function studentName(student) {
  return student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name || '-'
}

function initials(name) {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 3).toUpperCase()
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function AttendanceGrid({ title, description, kind = 'Regular', fajr = false }) {
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await api.classes.index()
        const loadedClasses = response?.data ?? []
        setClasses(loadedClasses)
        setClassId(loadedClasses[0]?.id ?? '')
      } catch (err) {
        console.error(err)
        setError('Klasat nuk u ngarkuan.')
      }
    }

    loadClasses()
  }, [])

  useEffect(() => {
    if (!classId) return

    async function loadStudents() {
      setLoading(true)
      try {
        const response = await api.students.index({ class_id: classId, per_page: 100 })
        const loadedStudents = response?.data ?? []
        setStudents(loadedStudents)
        setRecords(Object.fromEntries(loadedStudents.map((student) => [student.id, 'Present'])))
      } catch (err) {
        console.error(err)
        setError('Nxenesit nuk u ngarkuan.')
      } finally {
        setLoading(false)
      }
    }

    loadStudents()
  }, [classId])

  const cycle = (id) => {
    setRecords((prev) => {
      const current = prev[id]
      const idx = STATUSES.indexOf(current)
      return { ...prev, [id]: STATUSES[(idx + 1) % STATUSES.length] }
    })
  }

  async function saveAttendance() {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const payload = {
        class_id: Number(classId),
        date: today(),
        kind,
        records: students.map((student) => ({
          student_id: student.id,
          status: fajr && records[student.id] === 'Late' ? 'Excused' : records[student.id],
        })),
      }

      if (fajr) await api.attendance.storeFajr(payload)
      else await api.attendance.store(payload)

      setMessage('Prezenca u ruajt me sukses.')
    } catch (err) {
      console.error(err)
      setError('Prezenca nuk u ruajt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={title} description={description} actions={<Button onClick={saveAttendance} disabled={saving || !students.length}>{saving ? 'Duke ruajtur...' : 'Ruaj prezencen'}</Button>} />
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Klasa</Label>
            <Select className="w-44" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Select className="w-44" value={today()} disabled><option value={today()}>{formatDate(today())}</option></Select>
          </div>
        </CardContent>
      </Card>
      {(message || error) && (
        <div className={cn('mb-4 rounded-lg p-3 text-sm', message ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
          {message || error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">Regjistrim i shpejte</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-surface-300">Duke ngarkuar...</p>
          ) : students.length ? (
            <>
              <div className="flex flex-wrap gap-3">
                {students.map((student) => {
                  const status = records[student.id]
                  const cfg = statusConfig[status]
                  const name = studentName(student)
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => cycle(student.id)}
                      className={cn('flex flex-col items-center gap-1 rounded-xl border p-3 min-w-[72px] transition-colors', cfg.color)}
                    >
                      <span className="text-xs font-bold">{cfg.label}</span>
                      <span className="text-[10px]">{initials(name)}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-6 text-xs text-surface-300">
                {STATUSES.map((status) => <span key={status}><Badge variant={statusConfig[status].badge}>{statusConfig[status].label}</Badge> {statusConfig[status].text}</span>)}
              </div>
            </>
          ) : (
            <p className="text-sm text-surface-300">Nuk ka nxenes ne kete klase.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function AttendancePage() {
  return <AttendanceGrid title="Prezenca e klases" description="Sheno prezencen ditore sipas klases" />
}

export function FajrAttendancePage() {
  return <AttendanceGrid title="Prezenca e namazit te sabahut" description="Prezenca e mengjesit per nxenesit konviktore" kind="Fajr" fajr />
}

export function StudyHoursPage() {
  return <AttendanceGrid title="Prezenca ne oret e mesimit" description="Oret e mesimit ne mbremje ne konvikt" kind="Study" />
}

export function AttendanceReportsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await api.attendance.reports({ scope: 'my', per_page: 50 })
        setRecords(response?.data ?? [])
      } catch (err) {
        console.error(err)
        setError('Raporti nuk u ngarkua.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const stats = useMemo(() => {
    const total = records.length
    const present = records.filter((record) => record.status === 'Present').length
    return {
      total,
      rate: total ? Math.round((present / total) * 100) : 0,
    }
  }, [records])

  const colors = {
    Present: 'bg-emerald-500/40',
    Absent: 'bg-red-500/40',
    Late: 'bg-amber-500/40',
    Excused: 'bg-blue-500/40',
  }

  return (
    <div>
      <PageHeader title="Prezenca ime" description="Raporti yt i prezences per kete periudhe" />
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Harta e prezences</CardTitle></CardHeader>
        <CardContent>
          {records.length ? (
            <>
              <div className="grid grid-cols-7 gap-1 max-w-xs">
                {records.slice(0, 49).map((record) => (
                  <div key={record.id} className={cn('aspect-square rounded', colors[record.status] || 'bg-surface-700/40')} title={`${record.date} - ${record.status}`} />
                ))}
              </div>
              <p className="text-sm text-surface-300 mt-4">Prezenca: <span className="text-emerald-400 font-mono">{stats.rate}%</span></p>
            </>
          ) : (
            <p className={cn('text-sm', error ? 'text-red-400' : 'text-surface-300')}>{loading ? 'Duke ngarkuar...' : error || 'Nuk ka te dhena te prezences.'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
