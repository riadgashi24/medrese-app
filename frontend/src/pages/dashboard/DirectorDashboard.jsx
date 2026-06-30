import {
  Users,
  Bed,
  GraduationCap,
  DollarSign,
} from 'lucide-react'
import { PageHeader, ActivityList } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AttendanceBarChart, FeePieChart } from '@/components/charts/Charts'
import { attendanceOverview, recentActivity } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

export function DirectorDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Paneli Kryesor"
        description={`Përshëndetje, Drejtor! Ja një përmbledhje e gjendjes së shkollës për sot.`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Students" value="248" hint="+12 this month" icon={Users} trend="up" />
        <StatCard label="Boarding Students" value="142" hint="57% of total" icon={Bed} />
        <StatCard label="Teachers" value="24" hint="2 new hires" icon={GraduationCap} />
        <StatCard label="Revenue (MTD)" value="€18.4K" hint="+8% vs last month" icon={DollarSign} trend="up" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Attendance Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceBarChart data={attendanceOverview} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <FeePieChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityList items={recentActivity} />
        </CardContent>
      </Card>
    </div>
  )
}
