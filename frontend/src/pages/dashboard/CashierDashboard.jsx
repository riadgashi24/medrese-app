import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Receipt, AlertCircle, TrendingUp, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { RevenueBarChart } from '@/components/charts/Charts'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export function CashierDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [overviewRes, paymentsRes] = await Promise.all([
          api.finance.overview().catch(() => null),
          api.finance.payments({ per_page: 5 }).catch(() => null),
        ])
        setOverview(overviewRes?.data ?? null)
        setRecentPayments(paymentsRes?.data ?? [])
      } catch (err) {
        console.error('Failed to load cashier dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const chartData = overview?.revenueByCategory?.map((item) => ({
    category: item.category,
    amount: Number(item.amount ?? item.collected ?? 0),
  })) ?? []

  return (
    <div>
      <PageHeader
        title="Paneli Financiar"
        description={`Mirë se u ktheve, ${user?.name || 'Arkatar'}`}
        actions={
          <Link to="/finance/payments/new">
            <Button>Regjistro Pagesë</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Të Ardhurat"
          value={loading ? '...' : formatCurrency(overview?.totalRevenue ?? 0)}
          hint="Pagesa të përfunduara"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          label="Në Pritje"
          value={loading ? '...' : formatCurrency(overview?.totalPending ?? 0)}
          hint="Pagesa të paplotesuara"
          icon={Receipt}
        />
        <StatCard
          label="Borxhet"
          value={loading ? '...' : overview?.outstandingCount ?? 0}
          hint="Nxënës me borxh"
          icon={AlertCircle}
        />
        <StatCard
          label="Tarifat"
          value="Aktive"
          hint="Struktura e tarifave"
          icon={TrendingUp}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Të Ardhurat sipas Kategorisë</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-surface-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
              </div>
            ) : chartData.length > 0 ? (
              <RevenueBarChart data={chartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-surface-500 text-sm">
                Nuk ka të dhëna për kategoritë e tarifave.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-medium">Pagesat e Fundit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {loading ? (
              <div className="py-8 flex items-center justify-center text-surface-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
              </div>
            ) : recentPayments.length > 0 ? (
              recentPayments.slice(0, 5).map((p) => (
                <div key={p.id} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                  <div>
                    <p className="text-surface-200">{p.student?.full_name || p.student?.name || 'Nxënës'}</p>
                    <p className="text-[10px] text-surface-500">
                      {p.fee_type?.name || p.feeType?.name || 'Tarifë'} — {p.method || '-'}
                      {p.paid_at ? ` — ${formatDate(p.paid_at)}` : ''}
                    </p>
                  </div>
                  <span className="font-mono text-emerald-400">{formatCurrency(p.amount ?? 0)}</span>
                </div>
              ))
            ) : (
              <div className="py-8 flex items-center justify-center text-surface-500 text-sm">
                Nuk ka pagesa të regjistruara.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
