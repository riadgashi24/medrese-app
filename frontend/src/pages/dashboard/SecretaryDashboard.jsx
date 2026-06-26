import { Users, UserPlus, ClipboardList, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EnrollmentBarChart } from '@/components/charts/Charts'
import { enrollmentByClass, announcements } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

export function SecretaryDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name}`}
        actions={
          <Link to="/students/new">
            <Button>Enroll Student</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value="248" hint="+12 this month" icon={Users} trend="up" />
        <StatCard label="Pending Enrollments" value="5" hint="Awaiting documents" icon={UserPlus} />
        <StatCard label="Class Assignments" value="3" hint="Need review" icon={ClipboardList} />
        <StatCard label="Documents Due" value="8" hint="Certificates pending" icon={FileText} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Enrollment by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrollmentBarChart data={enrollmentByClass} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.slice(0, 4).map((a) => (
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
