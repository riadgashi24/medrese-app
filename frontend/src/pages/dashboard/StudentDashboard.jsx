import { GraduationCap, CheckCircle, ListChecks, CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { announcements } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

const todayClasses = [
  { time: '08:00', subject: 'Quran — Room 201' },
  { time: '09:00', subject: 'Mathematics — Room 105' },
  { time: '10:30', subject: 'Arabic — Room 203' },
  { time: '13:00', subject: 'Science — Lab 1' },
]

export function StudentDashboard({ isBoarding = false }) {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]}`}
        description={
          isBoarding
            ? `${user?.className} — ${user?.studentId} — ${user?.room}`
            : `${user?.className} — Student ID: ${user?.studentId}`
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="GPA" value="3.42" hint="+0.15 this term" icon={GraduationCap} trend="up" />
        <StatCard label="Attendance" value="94%" hint="Good standing" icon={CheckCircle} trend="up" />
        <StatCard label="Pending Tasks" value="3" hint="Due this week" icon={ListChecks} />
        <StatCard
          label="Fee Balance"
          value={isBoarding ? '€85' : '€0'}
          hint={isBoarding ? 'Dormitory due' : 'All paid'}
          icon={CreditCard}
          trend={isBoarding ? 'down' : 'up'}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {todayClasses.map((c) => (
              <div key={c.time} className="flex gap-3 py-2.5 border-b border-white/5 text-sm">
                <span className="font-mono text-[10px] text-cyan-400 w-10">{c.time}</span>
                <span className="text-surface-300">{c.subject}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Latest Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="border-b border-white/5 pb-3 last:border-0">
                <p className="text-sm text-surface-100">{a.title}</p>
                <p className="text-[10px] text-surface-700 mt-1">{a.date} — {a.author}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
