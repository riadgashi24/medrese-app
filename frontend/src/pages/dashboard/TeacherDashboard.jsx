import { BookOpen, CalendarCheck, NotebookPen, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PerformanceBarChart } from '@/components/charts/Charts'
import { classPerformance, teacherSchedule } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

const statusVariant = {
  Done: 'success',
  'In Progress': 'warning',
  Upcoming: 'slate',
}

export function TeacherDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${user?.name} — 5 classes today`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="My Classes" value="6" hint="168 students total" icon={BookOpen} />
        <StatCard label="Today's Lessons" value="5" hint="2 pending attendance" icon={CalendarCheck} />
        <StatCard label="Pending Grades" value="12" hint="Needs entry" icon={NotebookPen} />
        <StatCard label="Avg. Class Score" value="74%" hint="+3% improvement" icon={TrendingUp} trend="up" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {teacherSchedule.map((item) => (
              <div key={item.time} className="flex items-center gap-3 py-2.5 border-b border-white/5 text-sm">
                <span className="font-mono text-[10px] text-purple-400 w-10">{item.time}</span>
                <span className="flex-1 text-surface-300">{item.subject}</span>
                <Badge variant={statusVariant[item.status] || 'slate'}>{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Class Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceBarChart data={classPerformance} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">Recent Student Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { text: 'Ali K. — 3 absences this week', tag: 'Attendance', variant: 'red' },
            { text: 'Ayşe M. — Grade dropped below 50%', tag: 'Academic', variant: 'amber' },
            { text: 'Omar H. — Outstanding fee balance', tag: 'Finance', variant: 'blue' },
          ].map((alert) => (
            <div key={alert.text} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
              <span className="text-surface-300">{alert.text}</span>
              <Badge variant={alert.variant}>{alert.tag}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
