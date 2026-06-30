import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { StatCard } from '@/components/ui/StatCard'
import { RevenueBarChart } from '@/components/charts/Charts'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, AlertCircle, Receipt } from 'lucide-react'

function useApiData(load, fallback = []) {
  const [data, setData] = useState(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function run() {
      try {
        const response = await load()
        if (mounted) setData(response?.data ?? fallback)
      } catch (err) {
        console.error(err)
        if (mounted) setError('Te dhenat nuk u ngarkuan.')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}

function EmptyMessage({ loading, error }) {
  if (loading) return <p className="text-sm text-surface-300">Duke ngarkuar...</p>
  if (error) return <p className="text-sm text-red-400">{error}</p>
  return <p className="text-sm text-surface-300">Nuk ka te dhena per t’u shfaqur.</p>
}

function studentName(student) {
  if (!student) return '-'
  return student.full_name || [student.first_name, student.last_name].filter(Boolean).join(' ') || student.name || '-'
}

function normalizeRevenue(items = []) {
  return items.map((item) => ({
    category: item.category,
    amount: Number(item.amount ?? item.collected ?? item.total ?? 0),
  }))
}

export function FinanceOverviewPage() {
  const { data, loading, error } = useApiData(api.finance.overview, {})
  const chartData = normalizeRevenue(data.revenueByCategory)

  return (
    <div>
      <PageHeader title="Permbledhje financiare" description="Te ardhurat dhe mbledhja e pagesave" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Te ardhurat" value={formatCurrency(data.totalRevenue ?? 0)} hint="Pagesa te perfunduara" icon={DollarSign} trend="up" />
        <StatCard label="Ne pritje" value={formatCurrency(data.totalPending ?? 0)} hint="Pagesa te paplotesuara" icon={AlertCircle} />
        <StatCard label="Nxenes me borxh" value={data.outstandingCount ?? 0} hint="Balanca aktive" icon={Receipt} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Te ardhurat sipas kategorise</CardTitle></CardHeader>
        <CardContent>{chartData.length ? <RevenueBarChart data={chartData} /> : <EmptyMessage loading={loading} error={error} />}</CardContent>
      </Card>
    </div>
  )
}

export function PaymentsPage() {
  const { data, loading, error } = useApiData(() => api.finance.payments({ per_page: 100 }))
  const rows = data.map((payment) => ({
    id: payment.id,
    date: payment.paid_at || payment.created_at,
    student: studentName(payment.student),
    type: payment.fee_type?.name || '-',
    method: payment.method,
    amount: Number(payment.amount ?? 0),
    status: payment.status,
  }))
  const columns = [
    { key: 'date', label: 'Data', render: (r) => (r.date ? formatDate(r.date) : '-') },
    { key: 'student', label: 'Nxenesi' },
    { key: 'type', label: 'Lloji i tarifes' },
    { key: 'method', label: 'Metoda' },
    { key: 'amount', label: 'Shuma', render: (r) => <span className="font-mono text-emerald-400">{formatCurrency(r.amount)}</span> },
    { key: 'status', label: 'Statusi', render: (r) => <Badge variant={r.status === 'Completed' ? 'success' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Pagesat"
        description="Historiku dhe regjistrimet e pagesave"
        actions={<Link to="/finance/payments/new"><Button>Regjistro pagese</Button></Link>}
      />
      {rows.length ? <DataTable columns={columns} data={rows} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}

export function RecordPaymentPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [studentId, setStudentId] = useState('')
  const [feeTypeId, setFeeTypeId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, feesRes] = await Promise.all([
          api.students.index({ per_page: 100 }),
          api.finance.feeStructures(),
        ])
        const loadedStudents = studentsRes?.data ?? []
        const loadedFees = feesRes?.data ?? []
        setStudents(loadedStudents)
        setFees(loadedFees)
        setStudentId(loadedStudents[0]?.id ?? '')
        setFeeTypeId(loadedFees[0]?.fee_type_id ?? loadedFees[0]?.feeType?.id ?? '')
        setAmount(loadedFees[0]?.amount ?? '')
      } catch (err) {
        console.error(err)
        setError('Te dhenat per pagesen nuk u ngarkuan.')
      }
    }

    load()
  }, [])

  function handleFeeChange(value) {
    const fee = fees.find((item) => String(item.fee_type_id ?? item.feeType?.id) === String(value))
    setFeeTypeId(value)
    if (fee?.amount !== undefined) setAmount(fee.amount)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.finance.recordPayment({
        student_id: Number(studentId),
        fee_type_id: Number(feeTypeId),
        amount: Number(amount),
        method,
        status: 'Completed',
      })
      navigate('/finance/payments')
    } catch (err) {
      console.error(err)
      setError('Pagesa nuk u ruajt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Regjistro pagese" description="Regjistro manualisht pagesen e nxenesit" />
      <form onSubmit={handleSubmit}>
        <Card className="max-w-xl">
          <CardContent className="space-y-4">
            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}
            <div className="space-y-2">
              <Label>Nxenesi</Label>
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{studentName(student)} - {student.student_id}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lloji i tarifes</Label>
              <Select value={feeTypeId} onChange={(e) => handleFeeChange(e.target.value)} required>
                {fees.map((fee) => {
                  const id = fee.fee_type_id ?? fee.feeType?.id
                  return <option key={fee.id} value={id}>{fee.fee_type?.name || fee.feeType?.name || 'Tarife'}</option>
                })}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Shuma (EUR)</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Metoda</Label>
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="Cash">Kesh</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Online">Online</option>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading || !studentId || !feeTypeId}>{loading ? 'Duke ruajtur...' : 'Konfirmo pagesen'}</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export function OutstandingPage() {
  const { data, loading, error } = useApiData(api.finance.outstanding)
  const columns = [
    { key: 'name', label: 'Nxenesi' },
    { key: 'class_name', label: 'Klasa' },
    { key: 'balance', label: 'Borxhi', render: (r) => <span className="font-mono text-red-400">{formatCurrency(r.balance)}</span> },
    { key: 'type', label: 'Lloji' },
  ]

  return (
    <div>
      <PageHeader title="Borxhet" description="Nxenesit me tarifa te papaguara" />
      {data.length ? <DataTable columns={columns} data={data} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}

export function FinanceReportsPage() {
  const { data, loading, error } = useApiData(api.finance.reports, {})
  const chartData = (data.monthly_revenue ?? []).map((item) => ({
    category: item.month,
    amount: Number(item.total ?? 0),
  }))

  return (
    <div>
      <PageHeader title="Raportet financiare" description={`Analiza e te ardhurave${data.academic_year ? ` - ${data.academic_year}` : ''}`} />
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Te ardhurat mujore</CardTitle></CardHeader>
        <CardContent>{chartData.length ? <RevenueBarChart data={chartData} /> : <EmptyMessage loading={loading} error={error} />}</CardContent>
      </Card>
    </div>
  )
}

export function StudentPayPage() {
  const { data, loading, error } = useApiData(api.finance.feeStructures)
  const visibleFees = data.slice(0, 5)

  return (
    <div>
      <PageHeader title="Gjendja e pagesave" description="Shiko dhe paguaj tarifat aktive" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-body font-medium">Permbledhja e tarifave</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {visibleFees.map((fee) => (
              <div key={fee.id} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-surface-300">{fee.fee_type?.name || fee.feeType?.name || 'Tarife'}</span>
                <span className="font-mono">{formatCurrency(fee.amount)}</span>
              </div>
            ))}
            {!visibleFees.length && <EmptyMessage loading={loading} error={error} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-body font-medium">Paguaj online</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Zgjidh tarifen</Label>
              <Select>
                {visibleFees.map((fee) => (
                  <option key={fee.id}>{fee.fee_type?.name || fee.feeType?.name || 'Tarife'} - {formatCurrency(fee.amount)}</option>
                ))}
              </Select>
            </div>
            <Button className="w-full">Vazhdo te pagesa</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function FeeStructurePage() {
  const { data, loading, error } = useApiData(api.finance.feeStructures)

  return (
    <div>
      <PageHeader title="Tarifat" description="Menaxhimi i strukturës se tarifave" />
      <Card>
        <CardContent className="space-y-3">
          {data.map((fee) => (
            <div key={fee.id} className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-surface-200">{fee.fee_type?.name || fee.feeType?.name || 'Tarife'}</span>
              <span className="font-mono text-brand-400">{formatCurrency(fee.amount)}</span>
            </div>
          ))}
          {!data.length && <EmptyMessage loading={loading} error={error} />}
        </CardContent>
      </Card>
    </div>
  )
}

export function InvoicesPage() {
  const { data, loading, error } = useApiData(api.finance.invoices)
  const columns = [
    { key: 'invoice_no', label: 'Fatura' },
    { key: 'student', label: 'Nxenesi', render: (row) => studentName(row.student) },
    { key: 'total_amount', label: 'Shuma', render: (row) => formatCurrency(row.total_amount) },
    { key: 'status', label: 'Statusi' },
    { key: 'issued_at', label: 'Data', render: (row) => (row.issued_at ? formatDate(row.issued_at) : '-') },
  ]

  return (
    <div>
      <PageHeader title="Faturat dhe kuponet" description="Gjenero dhe menaxho faturat" actions={<Button>Gjenero fature</Button>} />
      {data.length ? <DataTable columns={columns} data={data} /> : <Card><CardContent><EmptyMessage loading={loading} error={error} /></CardContent></Card>}
    </div>
  )
}
