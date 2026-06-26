import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select, Label } from '@/components/ui/Input'
import { students } from '@/data/mockData'
import { cn } from '@/lib/utils'

const STATUSES = ['present', 'absent', 'late']
const statusConfig = {
  present: { label: 'P', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  absent: { label: 'A', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  late: { label: 'L', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
}

function AttendanceGrid({ title, description }) {
  const [records, setRecords] = useState(
    Object.fromEntries(students.slice(0, 8).map((s) => [s.id, 'present'])),
  )

  const cycle = (id) => {
    setRecords((prev) => {
      const current = prev[id]
      const idx = STATUSES.indexOf(current)
      return { ...prev, [id]: STATUSES[(idx + 1) % STATUSES.length] }
    })
  }

  return (
    <div>
      <PageHeader title={title} description={description} actions={<Button>Save Attendance</Button>} />
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select className="w-40"><option>10A</option><option>10B</option></Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Select className="w-40"><option>Today</option><option>Yesterday</option></Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">Quick Take View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {students.slice(0, 8).map((s) => {
              const status = records[s.id]
              const cfg = statusConfig[status]
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => cycle(s.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border p-3 min-w-[72px] transition-colors',
                    cfg.color,
                  )}
                >
                  <span className="text-xs font-bold">{cfg.label}</span>
                  <span className="text-[10px]">{s.name.split(' ').map((n) => n[0]).join('')}</span>
                </button>
              )
            })}
          </div>
          <div className="flex gap-4 mt-6 text-xs text-surface-300">
            <span><Badge variant="success">P</Badge> Present</span>
            <span><Badge variant="red">A</Badge> Absent</span>
            <span><Badge variant="amber">L</Badge> Late</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function AttendancePage() {
  return <AttendanceGrid title="Class Attendance" description="Mark daily attendance per class" />
}

export function FajrAttendancePage() {
  return <AttendanceGrid title="Fajr Prayer Attendance" description="Morning prayer attendance for boarding students" />
}

export function StudyHoursPage() {
  return <AttendanceGrid title="Study Hours Attendance" description="Evening study hours in dormitory" />
}

export function AttendanceReportsPage() {
  const days = Array.from({ length: 14 }, (_, i) => {
    const statuses = ['present', 'present', 'present', 'absent', 'present', 'late', 'off']
    return statuses[i % statuses.length]
  })
  const colors = { present: 'bg-emerald-500/40', absent: 'bg-red-500/40', late: 'bg-amber-500/40', off: 'bg-surface-700/40' }

  return (
    <div>
      <PageHeader title="My Attendance" description="Your attendance record this term" />
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Attendance Heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 max-w-xs">
            {days.map((d, i) => (
              <div key={i} className={cn('aspect-square rounded', colors[d])} title={d} />
            ))}
          </div>
          <p className="text-sm text-surface-300 mt-4">Overall attendance: <span className="text-emerald-400 font-mono">94%</span></p>
        </CardContent>
      </Card>
    </div>
  )
}
