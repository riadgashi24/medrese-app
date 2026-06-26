import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { StatCard } from '@/components/ui/StatCard'
import { RevenueBarChart } from '@/components/charts/Charts'
import { payments, revenueByCategory, feeStructure, students } from '@/data/mockData'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, AlertCircle, Receipt } from 'lucide-react'

export function FinanceOverviewPage() {
  return (
    <div>
      <PageHeader title="Financial Overview" description="Revenue and collection summary" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="MTD Revenue" value="€18.4K" hint="+8% vs last month" icon={DollarSign} trend="up" />
        <StatCard label="Outstanding" value="€2.4K" hint="18 students" icon={AlertCircle} />
        <StatCard label="Payments (MTD)" value="156" hint="91% collection rate" icon={Receipt} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Revenue by Category</CardTitle></CardHeader>
        <CardContent><RevenueBarChart data={revenueByCategory} /></CardContent>
      </Card>
    </div>
  )
}

export function PaymentsPage() {
  const columns = [
    { key: 'date', label: 'Date', render: (r) => formatDate(r.date) },
    { key: 'student', label: 'Student' },
    { key: 'type', label: 'Fee Type' },
    { key: 'method', label: 'Method' },
    { key: 'amount', label: 'Amount', render: (r) => <span className="font-mono text-emerald-400">{formatCurrency(r.amount)}</span> },
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'Completed' ? 'success' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Payment history and records"
        actions={
          <Link to="/finance/payments/new"><Button>Record Payment</Button></Link>
        }
      />
      <DataTable columns={columns} data={payments} />
    </div>
  )
}

export function RecordPaymentPage() {
  return (
    <div>
      <PageHeader title="Record Payment" description="Manually record a student payment" />
      <Card className="max-w-xl">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.studentId}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fee Type</Label>
            <Select>
              <option>Meal Fee</option>
              <option>Dormitory Fee</option>
              <option>Hifz Program</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (€)</Label>
              <Input type="number" defaultValue={85} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select>
                <option>Cash</option>
                <option>Transfer</option>
                <option>Online</option>
              </Select>
            </div>
          </div>
          <Button>Confirm Payment</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function OutstandingPage() {
  const outstanding = students.filter((s) => s.balance > 0)
  const columns = [
    { key: 'name', label: 'Student' },
    { key: 'className', label: 'Class' },
    { key: 'balance', label: 'Outstanding', render: (r) => <span className="font-mono text-red-400">{formatCurrency(r.balance)}</span> },
    { key: 'type', label: 'Type' },
  ]

  return (
    <div>
      <PageHeader title="Outstanding Balances" description="Students with unpaid fees" />
      <DataTable columns={columns} data={outstanding} />
    </div>
  )
}

export function FinanceReportsPage() {
  return (
    <div>
      <PageHeader title="Financial Reports" description="Revenue analytics and exports" />
      <Card>
        <CardHeader><CardTitle className="text-base font-body font-medium">Revenue by Category</CardTitle></CardHeader>
        <CardContent><RevenueBarChart data={revenueByCategory} /></CardContent>
      </Card>
    </div>
  )
}

export function StudentPayPage() {
  return (
    <div>
      <PageHeader title="Payment Status" description="View and pay outstanding fees" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-body font-medium">Fee Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {feeStructure.slice(0, 3).map((fee) => (
              <div key={fee.name} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-surface-300">{fee.name}</span>
                <span className="font-mono">{typeof fee.amount === 'number' ? formatCurrency(fee.amount) : fee.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-body font-medium">Pay Online</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Fee</Label>
              <Select><option>Monthly Meal Fee — €15</option><option>Dormitory Fee — €85</option></Select>
            </div>
            <Button className="w-full">Proceed to Payment</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function FeeStructurePage() {
  return (
    <div>
      <PageHeader title="Fee Configuration" description="Manage school fee structure" />
      <Card>
        <CardContent className="space-y-3">
          {feeStructure.map((fee) => (
            <div key={fee.name} className="flex justify-between items-center py-3 border-b border-white/5">
              <span className="text-surface-200">{fee.name}</span>
              <span className="font-mono text-brand-400">
                {typeof fee.amount === 'number' ? `${formatCurrency(fee.amount)}/month` : fee.amount}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function InvoicesPage() {
  return (
    <div>
      <PageHeader title="Invoices & Receipts" description="Generate and manage invoices" actions={<Button>Generate Invoice</Button>} />
      <Card><CardContent><p className="text-sm text-surface-300">No invoices generated yet this month.</p></CardContent></Card>
    </div>
  )
}
