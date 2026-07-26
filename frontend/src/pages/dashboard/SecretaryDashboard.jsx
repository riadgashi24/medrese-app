import { Users, UserPlus, ClipboardList, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EnrollmentBarChart } from '@/components/charts/Charts'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function SecretaryDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const response = await api.dashboard.secretary()
      setDashboard(response)
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <div>
      <PageHeader
        title="Paneli Kryesor"
        description={`Mirë se u ktheve, ${user?.name}`}
        actions={
          <Link to="/students/new">
            <Button>Regjistro nxënës</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/students">
          <StatCard
            label="Nxënës"
            value={dashboard?.stats?.total_students ?? '-'}
            hint="Gjithsej"
            icon={Users}
          />
        </Link>

        <StatCard
          label="Regjistrime në pritje"
          value={dashboard?.stats?.pending_enrollments ?? '-'}
          hint="Presin miratim"
          icon={UserPlus}
        />

        <StatCard
          label="Pa klasë"
          value={dashboard?.stats?.class_assignments ?? '-'}
          hint="Duhet caktuar"
          icon={ClipboardList}
        />

        <StatCard
          label="Dokumente"
          value={dashboard?.stats?.documents ?? '-'}
          hint="Në sistem"
          icon={FileText}
        />

      </div><div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium"> Numri i nxënësve sipas klasës</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.charts?.enrollment_by_class?.length ? (
              <EnrollmentBarChart
                data={dashboard.charts.enrollment_by_class}
              />
            ) : (
              <div className="h-72 flex items-center justify-center text-surface-600">
                Nuk ka të dhëna.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Njoftimet e fundit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard?.announcements?.slice(0, 4).map((a) => (
              <div key={a.id} className="border-b border-white/5 pb-3 last:border-0">
                <div className="border-b border-white/5 py-3 last:border-0">

                  <div className="flex items-center justify-between">

                    <p className="font-medium text-surface-100">
                      {a.title}
                    </p>

                    <span
                      className={`text-[10px] px-2 py-1 rounded-full ${a.priority === 'high'
                        ? 'bg-red-500/15 text-red-400'
                        : a.priority === 'normal'
                          ? 'bg-yellow-500/15 text-yellow-400'
                          : 'bg-green-500/15 text-green-400'
                        }`}
                    >
                      {a.priority === 'high'
                        ? 'Urgjent'
                        : a.priority === 'normal'
                          ? 'Normal'
                          : 'Informues'}
                    </span>

                  </div>

                  <p className="text-xs text-surface-600 mt-1">
                    {a.author} • {a.date}
                  </p>

                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div >)
}
