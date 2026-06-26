import { DollarSign, Receipt, AlertCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RevenueBarChart } from '@/components/charts/Charts'
import { revenueByCategory, payments } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function CashierDashboard() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        description={`Welcome back, ${user?.name}`}
        actions={
          <Link to="/finance/payments/new">
            <Button>Record Payment</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's Collections" value="€420" hint="+15% vs yesterday" icon={DollarSign} trend="up" />
        <StatCard label="Payments Today" value="12" hint="8 online, 4 cash" icon={Receipt} />
        <StatCard label="Outstanding" value="€2.4K" hint="18 students" icon={AlertCircle} />
        <StatCard label="Collection Rate" value="91%" hint="+2% this month" icon={TrendingUp} trend="up" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={revenueByCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                <div>
                  <p className="text-surface-200">{p.student}</p>
                  <p className="text-[10px] text-surface-700">{p.type} — {p.method}</p>
                </div>
                <span className="font-mono text-emerald-400">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
