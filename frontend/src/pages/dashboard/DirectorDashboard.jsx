import {
  Users,
  Bed,
  GraduationCap,
  CheckCircle
} from 'lucide-react'
import { PageHeader, ActivityList } from '@/components/ui/PageHeader'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AttendanceBarChart, FeePieChart } from '@/components/charts/Charts'
import { attendanceOverview, recentActivity } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export function DirectorDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const response = await api.dashboard.principal()
      setDashboard(response)
      console.log(dashboard);

    } catch (error) {
      console.error(error)
    }
  }


  return (
    <div>
      <PageHeader
        title="Paneli Kryesor"
        description={`Përshëndetje, Drejtor! Ja një përmbledhje e gjendjes së shkollës për sot.`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nxënës"
          value={dashboard?.stats.total_students ?? '-'}
          hint="Gjithsej"
          icon={Users}
        />
        <StatCard
          label="Konviktor"
          value={dashboard?.stats.boarding ?? '-'}
          hint={`${(dashboard?.stats.boarding / dashboard?.stats.total_students * 100) ?? '-'}% of total`}
          icon={Bed} />
        <StatCard
          label="Stafi"
          value={dashboard?.stats.total_staff ?? '-'}
          hint="Gjithsej"
          icon={GraduationCap} />
        <StatCard
          label="Kërkesa në pritje"
          value={dashboard?.stats.approvals ?? '-'}
          hint="+8% vs last month"
          icon={CheckCircle} />
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
