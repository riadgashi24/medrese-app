import {
  Users,
  Bed,
  GraduationCap,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { PageHeader, ActivityList } from '@/components/ui/PageHeader'
import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AttendanceBarChart, FeePieChart } from '@/components/charts/Charts'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export function DirectorDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      const response = await api.dashboard.principal()
      setDashboard(response)
    } catch (error) {
      console.error('Gabim gjatë ngarkimit të panelit:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Paneli Kryesor"
        description={`Përshëndetje, ${user?.name || 'Drejtor'}! Ja një përmbledhje e gjendjes së shkollës për sot.`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Nxënës"
          value={dashboard?.stats?.total_students ?? '-'}
          hint="Gjithsej"
          icon={Users}
        />
        <StatCard
          label="Konviktorë"
          value={dashboard?.stats?.boarding ?? '-'}
          hint={
            dashboard?.stats?.total_students && dashboard?.stats?.boarding !== undefined
              ? `${Math.round(
                (dashboard.stats.boarding / dashboard.stats.total_students) * 100
              )}% e nxënësve`
              : '-'
          }
          icon={Bed}
        />
        <StatCard
          label="Stafi"
          value={dashboard?.stats?.total_staff ?? '-'}
          hint="Gjithsej"
          icon={GraduationCap}
        />
        <StatCard
          label="Kërkesa në pritje"
          value={dashboard?.stats?.approvals ?? '-'}
          hint="Kërkojnë konfirmim"
          icon={CheckCircle}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Attendance - 7 Days Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">
              Frekuentimi gjatë 7 ditëve të fundit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Ngarkimi i të dhënave...
              </div>
            ) : (
              <AttendanceBarChart data={dashboard?.charts?.attendance_overview ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Today Attendance Pie/Doughnut Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">
              Frekuentimi sot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Ngarkimi i të dhënave...
              </div>
            ) : (
              <FeePieChart data={dashboard?.charts?.today_attendance ?? []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-medium">
            Aktiviteti i fundit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 flex items-center justify-center text-muted-foreground text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Ngarkimi i aktiviteteve...
            </div>
          ) : (
            <ActivityList items={dashboard?.recent_activity ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}