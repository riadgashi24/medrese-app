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
  const [dashboard, setDashboard] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const response = await api.dashboard.principal()
      setDashboard(response)

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Paneli Kryesor"
        description={`Përshëndetje, ${user?.name}! Ja një përmbledhje e gjendjes së shkollës për sot.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nxënës"
          value={dashboard?.stats?.total_students ?? '-'}
          hint="Gjithsej"
          icon={Users}
        />
        <StatCard
          label="Konviktor"
          value={dashboard?.stats?.boarding ?? '-'}
          hint={
            dashboard?.stats?.total_students
              ? `${Math.round(
                (dashboard?.stats?.boarding / dashboard?.stats?.total_students) * 100
              )}% e nxënësve`
              : "-"
          }
          icon={Bed} />
        <StatCard
          label="Stafi"
          value={dashboard?.stats?.total_staff ?? '-'}
          hint="Gjithsej"
          icon={GraduationCap} />
        <StatCard
          label="Kërkesa në pritje"
          value={dashboard?.stats?.approvals ?? '-'}
          icon={CheckCircle} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Frekuentimi gjatë 7 ditëve të fundit</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (<div >Loading...</div>) : (
              <AttendanceBarChart data={dashboard.charts.attendance_overview} />
            )}
          </CardContent>
        </Card>

        {/* Today Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Frekuentimi sot</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ?
              <div>Loading...</div>
              :
              <FeePieChart
                data={dashboard.charts.today_attendance}
              />
            }
          </CardContent>
        </Card>
      </div>

      {/* Tjera */}
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
