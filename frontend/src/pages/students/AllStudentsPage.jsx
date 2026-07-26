import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'

export function AllStudentsPage() {
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadAllStudents = async () => {
      try {
        const res = await api.students.index({ per_page: 2000 })

        const rawData = Array.isArray(res) ? res : res?.data || []

        const mapped = rawData.map((s) => ({
          id: s.id,
          studentId: s.student_id || '-',
          name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.name || '-',
          email: s.student_email || s.email || '-',
          className: s.class_name || '-',
          type: s.type,
          status: s.status,
        }))
        setStudents(mapped)
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të të gjithë nxënësve:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAllStudents()
  }, [])

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase()) ||
    s.className.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'studentId',
      label: 'ID',
      render: (r) => <span className="font-mono text-xs">{r.studentId}</span>,
    },
    {
      key: 'name',
      label: 'Emri i Plotë',
      render: (r) => <span className="font-medium text-surface-100">{r.name}</span>,
    },
    {
      key: 'className',
      label: 'Klasa',
      render: (r) => <Badge variant="slate">{r.className}</Badge>,
    },
    {
      key: 'email',
      label: 'Email',
      render: (r) => <span className="text-xs text-surface-400">{r.email}</span>,
    },
    {
      key: 'type',
      label: 'Regjimi',
      render: (r) => (
        <Badge variant={r.type === 'Boarding' ? 'blue' : 'slate'}>
          {r.type === 'Boarding' ? 'Konviktor' : 'Ditor'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Statusi',
      render: (r) => (
        <Badge variant={String(r.status).toLowerCase() === 'active' ? 'success' : 'slate'}>
          {String(r.status).toLowerCase() === 'active' ? 'Aktiv' : 'Joaktiv'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regjistri Global i Nxënësve"
        description="Lista e plotë e të gjithë nxënësve të regjistruar në sistem."
        actions={
          <Link to="/students/new">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Regjistro Nxënës të Ri
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Kërko sipas emrit, ID-së ose klasës..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="h-64 animate-pulse bg-surface-800 rounded-xl" />
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          onRowClick={(row) => navigate(`/students/${row.id}`)}
        />
      )}
    </div>
  )
}