import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react'
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
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.students.index({ per_page: 25, page, search: search.trim() || undefined })

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
        setMeta(res?.meta || { current_page: page, last_page: 1, total: mapped.length })
      } catch (err) {
        console.error('Gabim gjatë ngarkimit të nxënësve:', err)
        setError('Nuk u ngarkua lista e nxënësve.')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [page, search])

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
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="h-64 animate-pulse bg-surface-800 rounded-xl" />
        </Card>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-sm text-red-400">{error}</CardContent></Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={students}
            onRowClick={(row) => navigate(`/students/${row.id}`)}
          />
          {!students.length ? (
            <Card><CardContent className="py-8 text-center text-sm text-surface-400">Nuk u gjetën nxënës.</CardContent></Card>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-surface-400">
              <span>{meta.total} nxënës gjithsej</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Faqja paraprake"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>Faqja {meta.current_page || page} / {meta.last_page || 1}</span>
                <Button
                  variant="secondary"
                  size="icon"
                  disabled={page >= (meta.last_page || 1)}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Faqja pasuese"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}