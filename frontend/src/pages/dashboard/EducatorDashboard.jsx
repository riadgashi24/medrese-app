import { Bed, Sun, Gavel, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendLineChart } from '@/components/charts/Charts'
import { fajrTrend, roomInspections } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'

const toneClass = {
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
}

export function EducatorDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${user?.name} — Block A & B Supervisor`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Boarding Students" value="142" hint="Block A: 72 / Block B: 70" icon={Bed} />
        <StatCard label="Fajr Attendance" value="89%" hint="126/142 present" icon={Sun} trend="up" />
        <StatCard label="Discipline (Week)" value="7" hint="3 pending review" icon={Gavel} />
        <StatCard label="Room Score Avg" value="8.2" hint="out of 10" icon={Sparkles} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Room Inspection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {roomInspections.map((room) => (
              <div key={room.room} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                <span className="text-surface-300">{room.room}</span>
                <span className={`text-xs font-mono ${toneClass[room.tone]}`}>{room.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Fajr Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLineChart data={fajrTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
